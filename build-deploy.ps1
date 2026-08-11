<#
.SYNOPSIS
  Builds the storefront and the API into one folder ready to upload to myasp.net.

.DESCRIPTION
  Produces .\publish - the ASP.NET application with the exported storefront inside
  its wwwroot. That single folder is the whole deployment: the shop, the API and
  the admin panel all served from one site on one domain.

  Run the API locally before building. The storefront asks it which products exist
  so each one gets its own prerendered page; without it the build still succeeds,
  but every product page arrives as an empty shell that fills in after a round trip.

.PARAMETER BuildApiUrl
  Where to read the live catalogue from while building. The local API by default.

.EXAMPLE
  .\build-deploy.ps1
#>
param(
  [string]$BuildApiUrl = "http://localhost:5080/api"
)

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot

<#
  Runs a command-line tool and judges it by its exit code.

  Windows PowerShell treats anything a native program writes to stderr as an
  error record, and with ErrorActionPreference set to Stop that aborts the script
  - even when the program went on to succeed. Next prints ordinary progress there,
  so a clean build would kill the deploy. The exit code is the only honest signal.
#>
function Invoke-Tool {
  param([string]$Exe, [string[]]$Arguments, [string]$What)

  $previous = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  try { & $Exe @Arguments 2>&1 | ForEach-Object { "$_" } }
  finally { $ErrorActionPreference = $previous }

  if ($LASTEXITCODE -ne 0) { throw "$What failed (exit code $LASTEXITCODE)." }
}

<#
  Find dotnet.
  The installer adds it to PATH, but a shell opened before the install was run
  still has the old copy of PATH and reports "dotnet is not recognized" - which
  reads like .NET is missing rather than like the window is stale.
#>
$dotnet = (Get-Command dotnet -ErrorAction SilentlyContinue).Source
if (-not $dotnet) {
  $fallback = Join-Path $env:ProgramFiles "dotnet\dotnet.exe"
  if (Test-Path $fallback) { $dotnet = $fallback }
  else { throw "Could not find dotnet. Install the .NET 10 SDK, then open a new terminal." }
}

Write-Host "==> Building the storefront" -ForegroundColor Cyan

# A relative /api, because the storefront and the API are served from the same
# site. An absolute URL here would break the moment the domain changed, and would
# need CORS configured to work at all.
$env:NEXT_PUBLIC_API_URL = "/api"
$env:BUILD_API_URL = $BuildApiUrl

Push-Location (Join-Path $root "smafuelmarket")
try {
  Invoke-Tool -Exe "npm.cmd" -Arguments @("run", "build") -What "The storefront build"
}
finally { Pop-Location }

Write-Host "==> Copying the storefront into the API's wwwroot" -ForegroundColor Cyan

$wwwroot = Join-Path $root "api-dotnet\wwwroot"
if (Test-Path $wwwroot) { Remove-Item -Recurse -Force $wwwroot }
Copy-Item -Recurse (Join-Path $root "smafuelmarket\out") $wwwroot

$pages = (Get-ChildItem -Recurse -File $wwwroot).Count
Write-Host "    $pages files"

Write-Host "==> Publishing the API" -ForegroundColor Cyan

$publish = Join-Path $root "publish"
if (Test-Path $publish) {
  <#
    A copy of the site still running out of this folder holds its DLLs open, and
    Windows reports that as "access to the path is denied" - which reads like a
    permissions problem rather than "stop the app first".
  #>
  try { Remove-Item -Recurse -Force $publish -ErrorAction Stop }
  catch {
    throw "Could not clear $publish - a published copy is probably still running. " +
          "Stop it and run this again. (Find it with: netstat -ano | findstr LISTENING)"
  }
}

Push-Location (Join-Path $root "api-dotnet")
try {
  Invoke-Tool -Exe $dotnet -Arguments @("publish", "-c", "Release", "-o", $publish) -What "The API publish"
}
finally { Pop-Location }

# Never ship the development settings: they carry a local connection string and
# the throwaway signing key, and appsettings.Development.json would be picked up
# if the host ever set ASPNETCORE_ENVIRONMENT to Development.
Remove-Item (Join-Path $publish "appsettings.Development.json") -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "Ready: $publish" -ForegroundColor Green
Write-Host ""
Write-Host "Before uploading, edit appsettings.Production.json in that folder and fill in:" -ForegroundColor Yellow
Write-Host "  ConnectionStrings:Default   your myasp.net MySQL details"
Write-Host "  Jwt:Secret                  32+ random characters (the app will not start without it)"
Write-Host "  FrontendUrl                 https://your-site.myasp.net"
Write-Host "  Uploads:Directory           a folder OUTSIDE the site, so a redeploy cannot erase the photos"
Write-Host ""
Write-Host "Then upload the contents of publish\ to the site root, and copy" -ForegroundColor Yellow
Write-Host "api\uploads\ to whatever you set Uploads:Directory to."
