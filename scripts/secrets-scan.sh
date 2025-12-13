#!/bin/bash
# ============================================================================
# SECRETS SCAN SCRIPT
# ============================================================================
# Scans codebase for potentially exposed secrets, API keys, and credentials
# Should be run as part of CI/CD pipeline or pre-deploy checks
#
# Exit codes:
#   0 - No secrets found
#   1 - Potential secrets detected (review required)
#   2 - Script error
# ============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=============================================="
echo "  SECRETS SCAN - Checking for Exposed Secrets"
echo "=============================================="
echo ""

# Track if any secrets found
SECRETS_FOUND=0
WARNINGS=0

# Directories to scan (exclude node_modules, .git, etc.)
SCAN_DIRS="server client shared scripts"
EXCLUDE_DIRS="node_modules|\.git|dist|build|\.next|coverage"

# Files to exclude (test fixtures, snapshots, etc.)
EXCLUDE_FILES="\.snap$|\.test\.|\.spec\.|package-lock\.json|yarn\.lock"

# ============================================================================
# SECRET PATTERNS
# ============================================================================
# Each pattern has a name and regex. Be careful of false positives.

declare -A PATTERNS

# API Keys - Generic patterns
PATTERNS["Generic API Key"]='(?i)(api[_-]?key|apikey)\s*[:=]\s*["\x27]?[a-zA-Z0-9_\-]{16,}["\x27]?'
PATTERNS["Generic Secret"]='(?i)(secret[_-]?key|secretkey)\s*[:=]\s*["\x27]?[a-zA-Z0-9_\-]{16,}["\x27]?'
PATTERNS["Generic Token"]='(?i)(access[_-]?token|auth[_-]?token)\s*[:=]\s*["\x27]?[a-zA-Z0-9_\-]{16,}["\x27]?'

# Service-specific patterns
PATTERNS["AWS Access Key"]='AKIA[0-9A-Z]{16}'
PATTERNS["AWS Secret Key"]='(?i)aws[_-]?secret[_-]?access[_-]?key\s*[:=]\s*["\x27]?[a-zA-Z0-9/+=]{40}["\x27]?'
PATTERNS["GitHub Token"]='ghp_[a-zA-Z0-9]{36}'
PATTERNS["GitHub OAuth"]='gho_[a-zA-Z0-9]{36}'
PATTERNS["OpenAI API Key"]='sk-[a-zA-Z0-9]{48}'
PATTERNS["Stripe Secret Key"]='sk_live_[a-zA-Z0-9]{24,}'
PATTERNS["Stripe Publishable Key Live"]='pk_live_[a-zA-Z0-9]{24,}'
PATTERNS["Twilio Account SID"]='AC[a-f0-9]{32}'
PATTERNS["Twilio Auth Token"]='(?i)twilio[_-]?auth[_-]?token\s*[:=]\s*["\x27]?[a-f0-9]{32}["\x27]?'
PATTERNS["Sendgrid API Key"]='SG\.[a-zA-Z0-9_-]{22}\.[a-zA-Z0-9_-]{43}'
PATTERNS["Slack Token"]='xox[baprs]-[0-9a-zA-Z]{10,48}'
PATTERNS["Slack Webhook"]='https://hooks\.slack\.com/services/T[a-zA-Z0-9_]+/B[a-zA-Z0-9_]+/[a-zA-Z0-9_]+'
PATTERNS["Google API Key"]='AIza[0-9A-Za-z\-_]{35}'
PATTERNS["Firebase Key"]='(?i)firebase[_-]?api[_-]?key\s*[:=]\s*["\x27]?[a-zA-Z0-9_\-]{30,}["\x27]?'
PATTERNS["Mailchimp API Key"]='[a-f0-9]{32}-us[0-9]{1,2}'
PATTERNS["Heroku API Key"]='(?i)heroku.*[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}'

# Database connection strings (be careful with these)
PATTERNS["Database URL with Password"]='(?i)(postgres|mysql|mongodb|redis)://[^:]+:[^@\s]+@[^\s]+'
PATTERNS["Connection String Password"]='(?i)password\s*[:=]\s*["\x27][^"\x27]{8,}["\x27]'

# Private keys
PATTERNS["RSA Private Key"]='-----BEGIN RSA PRIVATE KEY-----'
PATTERNS["DSA Private Key"]='-----BEGIN DSA PRIVATE KEY-----'
PATTERNS["EC Private Key"]='-----BEGIN EC PRIVATE KEY-----'
PATTERNS["Generic Private Key"]='-----BEGIN PRIVATE KEY-----'
PATTERNS["PGP Private Key"]='-----BEGIN PGP PRIVATE KEY BLOCK-----'

# JWT tokens (long base64 strings with dots)
PATTERNS["JWT Token"]='eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+'

# Base64 encoded secrets (potential)
PATTERNS["Base64 Encoded Secret"]='(?i)(password|secret|key|token)\s*[:=]\s*["\x27]?[A-Za-z0-9+/]{40,}={0,2}["\x27]?'

# ============================================================================
# SAFE PATTERNS (false positive exclusions)
# ============================================================================
# These are patterns that should NOT be flagged

SAFE_PATTERNS=(
  "process\.env\."           # Environment variable references
  "getenv\("                 # Python getenv
  "os\.environ"              # Python environ
  "ENV\["                    # Ruby ENV
  "EXAMPLE"                  # Example values
  "YOUR_"                    # Placeholder patterns
  "xxx"                      # Placeholder patterns (3+ x's)
  "<.*>"                     # Placeholder in angle brackets
  "\[.*\]"                   # Placeholder in square brackets
  "\.example"                # Example files
  "test_"                    # Test prefixes
  "fake_"                    # Fake prefixes
  "dummy"                    # Dummy values
  "placeholder"              # Placeholder values
  "CHANGE_ME"                # Placeholder
  "INSERT_"                  # Placeholder
  "REPLACE_"                 # Placeholder
  "errors\."                 # Validation error messages (JS objects)
  "newErrors\."              # Validation error objects
  "setInviteErrors"          # React state setters
  "Password is required"     # Error message strings
  "Password must be"         # Validation messages
  "\.password\s*="           # Password validation assignments
  "required.*password"       # Required field messages
  "settings\.secret"         # Property accessors (not values)
  "getSecret\("              # Secret getter functions
  "fetchSecret\("            # Secret fetcher functions
)

# ============================================================================
# SCANNING FUNCTION
# ============================================================================

scan_for_pattern() {
  local pattern_name="$1"
  local pattern="$2"
  local found=0
  local actual_findings=0
  
  # Use grep with PCRE for each directory
  for dir in $SCAN_DIRS; do
    if [ -d "$dir" ]; then
      # Find all files, exclude patterns, then grep
      results=$(find "$dir" -type f \
        -not -path "*/node_modules/*" \
        -not -path "*/.git/*" \
        -not -path "*/dist/*" \
        -not -path "*/build/*" \
        -not -name "*.snap" \
        -not -name "package-lock.json" \
        -not -name "yarn.lock" \
        -not -name "*.min.js" \
        -not -name "*.map" \
        2>/dev/null | xargs grep -lP "$pattern" 2>/dev/null || true)
      
      if [ -n "$results" ]; then
        for file in $results; do
          # Get matching lines
          matching_lines=$(grep -P "$pattern" "$file" 2>/dev/null || true)
          
          # Check if ALL matching lines are safe (false positives)
          all_safe=1
          while IFS= read -r match_line; do
            line_is_safe=0
            for safe in "${SAFE_PATTERNS[@]}"; do
              if echo "$match_line" | grep -qE "$safe"; then
                line_is_safe=1
                break
              fi
            done
            if [ $line_is_safe -eq 0 ]; then
              all_safe=0
              break
            fi
          done <<< "$matching_lines"
          
          if [ $all_safe -eq 0 ]; then
            if [ $found -eq 0 ]; then
              echo -e "${RED}[ALERT]${NC} $pattern_name found:"
              found=1
            fi
            echo "  - $file"
            actual_findings=$((actual_findings + 1))
            # Show matching lines (truncated for security)
            grep -nP "$pattern" "$file" 2>/dev/null | head -3 | while read -r line; do
              echo "    Line: ${line:0:80}..."
            done
          fi
        done
      fi
    fi
  done
  
  # Return 0 (success/true in bash) if secrets found, 1 if not
  if [ $found -eq 1 ]; then
    return 0
  else
    return 1
  fi
}

# ============================================================================
# MAIN SCANNING LOOP
# ============================================================================

echo "Scanning directories: $SCAN_DIRS"
echo ""

for pattern_name in "${!PATTERNS[@]}"; do
  pattern="${PATTERNS[$pattern_name]}"
  if scan_for_pattern "$pattern_name" "$pattern"; then
    SECRETS_FOUND=$((SECRETS_FOUND + 1))
  fi
done

# ============================================================================
# CHECK FOR HARDCODED CREDENTIALS IN COMMON LOCATIONS
# ============================================================================

echo ""
echo "Checking for hardcoded credentials in common locations..."

# Check for .env files that might be committed
ENV_FILES=$(find . -name ".env" -o -name ".env.local" -o -name ".env.production" -o -name ".env.development" 2>/dev/null | grep -v node_modules || true)
if [ -n "$ENV_FILES" ]; then
  echo -e "${YELLOW}[WARNING]${NC} .env files found (ensure these are in .gitignore):"
  echo "$ENV_FILES"
  WARNINGS=$((WARNINGS + 1))
fi

# Check for common config files with potential secrets
CONFIG_FILES=$(find . \( -name "config.json" -o -name "credentials.json" -o -name "secrets.json" \) 2>/dev/null | grep -v node_modules || true)
if [ -n "$CONFIG_FILES" ]; then
  echo -e "${YELLOW}[WARNING]${NC} Config files found that may contain secrets:"
  echo "$CONFIG_FILES"
  WARNINGS=$((WARNINGS + 1))
fi

# Check .gitignore for common secret file patterns
echo ""
echo "Verifying .gitignore protections..."
GITIGNORE_CHECKS=(
  ".env"
  ".env.local"
  ".env.production"
  "*.pem"
  "*.key"
  "credentials.json"
  "secrets.json"
)

if [ -f ".gitignore" ]; then
  for check in "${GITIGNORE_CHECKS[@]}"; do
    if ! grep -q "$check" .gitignore 2>/dev/null; then
      echo -e "${YELLOW}[WARNING]${NC} $check not found in .gitignore"
      WARNINGS=$((WARNINGS + 1))
    fi
  done
else
  echo -e "${YELLOW}[WARNING]${NC} No .gitignore file found!"
  WARNINGS=$((WARNINGS + 1))
fi

# ============================================================================
# SUMMARY
# ============================================================================

echo ""
echo "=============================================="
echo "  SCAN COMPLETE"
echo "=============================================="

if [ $SECRETS_FOUND -gt 0 ]; then
  echo -e "${RED}[FAIL]${NC} Found $SECRETS_FOUND potential secret pattern(s)"
  echo ""
  echo "Action Required:"
  echo "  1. Review each finding above"
  echo "  2. If it's a real secret, remove it and rotate the credential"
  echo "  3. Use environment variables for all secrets"
  echo "  4. Add files with secrets to .gitignore"
  echo ""
  exit 1
elif [ $WARNINGS -gt 0 ]; then
  echo -e "${YELLOW}[PASS WITH WARNINGS]${NC} No secrets found, but $WARNINGS warning(s) to review"
  exit 0
else
  echo -e "${GREEN}[PASS]${NC} No exposed secrets detected"
  exit 0
fi
