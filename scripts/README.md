# BREE AI Scripts

Utility scripts for managing BREE AI deployments and data.

## 📋 Available Scripts

### get-feedback.sh

Retrieve and manage AI feedback submissions from fly.io deployment.

**Prerequisites:**
- [fly CLI](https://fly.io/docs/hands-on/install-flyctl/) installed
- Authenticated with fly.io (`fly auth login`)
- `jq` installed (for report generation)

**Installation:**
```bash
# Make executable (already done)
chmod +x scripts/get-feedback.sh

# Optional: Add to PATH
ln -s $(pwd)/scripts/get-feedback.sh /usr/local/bin/bree-feedback
```

**Usage:**

```bash
# List all feedback files
./scripts/get-feedback.sh list

# Show feedback statistics
./scripts/get-feedback.sh count

# View a specific feedback
./scripts/get-feedback.sh view feedback-2026-02-09T02-01-34-585Z-76c7814e.json

# Download all feedbacks
./scripts/get-feedback.sh download

# Download feedbacks for a specific date
./scripts/get-feedback.sh download-date 2026-02-09

# Generate comprehensive report
./scripts/get-feedback.sh report

# Watch for new feedbacks (real-time polling)
./scripts/get-feedback.sh watch

# Show help
./scripts/get-feedback.sh help
```

**Environment Variables:**
```bash
# Override default app name
FLY_APP_NAME=bree-api ./scripts/get-feedback.sh list
```

**Output Directory:**
```bash
feedback-downloads/
├── feedback-2026-02-09T02-01-34-585Z-76c7814e.json
├── feedback-2026-02-09T14-23-45-123Z-abc12345.json
└── ...
```

---

## 📊 Examples

### View Recent Feedbacks
```bash
./scripts/get-feedback.sh count
```
Output:
```
========================================
Feedback Statistics
========================================
✓ Total feedbacks: 15

ℹ Feedback breakdown:
   3 "type": "bug"
   8 "type": "feature"
   4 "type": "enhancement"
```

### Download and Analyze
```bash
# Download all feedbacks
./scripts/get-feedback.sh download

# Generate detailed report
./scripts/get-feedback.sh report
```

### Monitor Live Feedbacks
```bash
# Watch for new submissions
./scripts/get-feedback.sh watch
```

---

## 🔧 Troubleshooting

**Error: `fly CLI not found`**
```bash
# Install fly CLI
curl -L https://fly.io/install.sh | sh

# Or via Homebrew
brew install flyctl
```

**Error: `App not found`**
```bash
# List available apps
fly apps list

# Set correct app name
export FLY_APP_NAME=your-app-name
```

**Error: `jq not found`**
```bash
# macOS
brew install jq

# Linux
apt-get install jq

# Or use download command instead of report
./scripts/get-feedback.sh download
```

---

## 📝 Script Features

✅ **List & Count** - View all feedback files and statistics
✅ **View** - Read specific feedback with pretty printing
✅ **Download** - Fetch feedbacks locally for analysis
✅ **Filter by Date** - Download feedbacks for specific dates
✅ **Report Generation** - Comprehensive summary with breakdown
✅ **Live Monitoring** - Watch for new submissions in real-time
✅ **Color Output** - Easy-to-read terminal output
✅ **Error Handling** - Robust error checking and helpful messages

---

## 🚀 Advanced Usage

### Automated Daily Downloads
```bash
# Add to crontab
0 0 * * * cd /path/to/bree-ai && ./scripts/get-feedback.sh download-date $(date +\%Y-\%m-\%d)
```

### Export to CSV
```bash
# Download all feedbacks
./scripts/get-feedback.sh download

# Convert to CSV using jq
cd feedback-downloads
jq -r '["type","name","email","description","receivedAt"],
       (.type, .name, .email // "", .description, .receivedAt) | @csv' \
       *.json > feedbacks.csv
```

### Filter and Search
```bash
# Download all
./scripts/get-feedback.sh download

# Find bug reports
grep -l '"type": "bug"' feedback-downloads/*.json

# Find feedbacks from specific brand
jq 'select(.metadata.brand == "habitaware-ai")' feedback-downloads/*.json
```

---

## 📦 Integration with CI/CD

```yaml
# .github/workflows/feedback-report.yml
name: Weekly Feedback Report

on:
  schedule:
    - cron: '0 0 * * 0'  # Every Sunday at midnight
  workflow_dispatch:

jobs:
  generate-report:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Install fly CLI
        run: curl -L https://fly.io/install.sh | sh

      - name: Install jq
        run: sudo apt-get install -y jq

      - name: Generate Report
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
        run: |
          ./scripts/get-feedback.sh report > weekly-report.txt

      - name: Upload Report
        uses: actions/upload-artifact@v2
        with:
          name: feedback-report
          path: weekly-report.txt
```

---

**For more information, see the main [README.md](../README.md)**
