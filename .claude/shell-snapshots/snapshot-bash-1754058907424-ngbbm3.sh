# Snapshot file
# Unset all aliases to avoid conflicts with functions
unalias -a 2>/dev/null || true
shopt -s expand_aliases
# Check for rg availability
if ! command -v rg >/dev/null 2>&1; then
  alias rg=''\''C:\Users\jtowe\AppData\Roaming\npm\node_modules\@anthropic-ai\claude-code\vendor\ripgrep\x64-win32\rg.exe'\'''
fi
export PATH='/mingw64/bin:/usr/bin:/c/Users/jtowe/bin:/c/Python313/Scripts:/c/Python313:/c/Windows/system32:/c/Windows:/c/Windows/System32/Wbem:/c/Windows/System32/WindowsPowerShell/v1.0:/c/Windows/System32/OpenSSH:/c/Program Files/dotnet:/c/Program Files/nodejs:/c/ProgramData/chocolatey/bin:/cmd:/c/Users/jtowe/.local/bin:/c/Users/jtowe/AppData/Local/Microsoft/WindowsApps:/c/Users/jtowe/AppData/Local/Programs/Microsoft VS Code/bin:/c/Users/jtowe/AppData/Local/GitHubDesktop/bin:/c/Users/jtowe/AppData/Local/Programs/cursor/resources/app/bin:/c/Users/jtowe/AppData/Roaming/npm'
