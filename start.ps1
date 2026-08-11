<#
.SYNOPSIS
  Starts the shop locally: MySQL, the site, and the database browser.

.DESCRIPTION
  Three things have to be running, in this order:

    MySQL          port 3307   the shop's data
    The site       port 5080   storefront, admin panel and API, all one app
    DB browser     port 8088   a web page for looking at the database

  Each opens in its own window. Close a window to stop that piece.

  Port 3307 rather than the usual 3306 because 3306 is taken by an existing
  MariaDB install, which this deliberately does not touch.

  None of this applies on myasp.net: IIS starts the site on the first request,
  and MySQL is a managed service there.

.EXAMPLE
  .\start.ps1
#>

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot

$mysqld = "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqld.exe"
$dataDir = Join-Path $root ".mysqldata"
$publish = Join-Path $root "publish"
$uploads = Join-Path $root "api\uploads"

function Test-Port([int]$Port) {
  $listener = Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue
  return $null -ne $listener
}

# ---- MySQL ------------------------------------------------------------------

if (Test-Port 3307) {
  Write-Host "MySQL already running on 3307" -ForegroundColor DarkGray
}
else {
  if (-not (Test-Path $mysqld)) { throw "Could not find mysqld at $mysqld" }
  if (-not (Test-Path $dataDir)) { throw "The database folder is missing: $dataDir" }

  <#
    Undo tablespaces left behind by an unclean shutdown stop MySQL from starting
    again, with an error that reads like corruption. They are rebuilt on startup,
    so clearing them is the fix rather than a workaround.
  #>
  Remove-Item (Join-Path $dataDir "undo_001") -ErrorAction SilentlyContinue
  Remove-Item (Join-Path $dataDir "undo_002") -ErrorAction SilentlyContinue

  Write-Host "Starting MySQL on 3307..." -ForegroundColor Cyan
  Start-Process -FilePath $mysqld `
    -ArgumentList "--datadir=`"$dataDir`"", "--port=3307", "--console"

  # The site cannot connect to a database that has not finished opening, and it
  # exits rather than retrying, so wait for MySQL to actually answer.
  $ready = $false
  foreach ($attempt in 1..30) {
    Start-Sleep -Seconds 1
    if (Test-Port 3307) { $ready = $true; break }
  }
  if (-not $ready) { throw "MySQL did not start. Check the window it opened." }
}

# ---- The site ---------------------------------------------------------------

if (Test-Port 5080) {
  Write-Host "The site is already running on 5080" -ForegroundColor DarkGray
}
else {
  if (-not (Test-Path (Join-Path $publish "SmaFuelMarket.Api.dll"))) {
    throw "Nothing published yet. Run .\build-deploy.ps1 first."
  }

  Write-Host "Starting the shop on 5080..." -ForegroundColor Cyan

  # A local signing key. The real one belongs in appsettings.Production.json on
  # the host and must not be this.
  $env:ASPNETCORE_ENVIRONMENT = "Production"
  $env:ASPNETCORE_URLS = "http://localhost:5080"
  $env:ConnectionStrings__Default = "server=127.0.0.1;port=3307;database=smafuelmarket;user=root;password=;AllowPublicKeyRetrieval=true;SslMode=Preferred"
  $env:Jwt__Secret = "local-development-key-not-for-production-use"
  $env:FrontendUrl = "http://localhost:5080"
  $env:Uploads__Directory = $uploads

  Start-Process -FilePath "dotnet" -ArgumentList "SmaFuelMarket.Api.dll" -WorkingDirectory $publish
}

# ---- Database browser -------------------------------------------------------

if (Test-Port 8088) {
  Write-Host "The database browser is already running on 8088" -ForegroundColor DarkGray
}
else {
  Write-Host "Starting the database browser on 8088..." -ForegroundColor Cyan
  Start-Process -FilePath "node" -ArgumentList "db-browser.js" -WorkingDirectory $root
}

Start-Sleep -Seconds 6

Write-Host ""
Write-Host "  Shop      http://localhost:5080" -ForegroundColor Green
Write-Host "  Admin     http://localhost:5080/admin/    admin@smafuel.market / admin123"
Write-Host "  Database  http://localhost:8088"
Write-Host ""
