# Zoho Catalyst Deployment Guide

## Prerequisites

- Zoho Catalyst account
- Project files in the `client` folder

## Deployment Steps

### 1. Prepare Your Files

- Ensure all files are in the `client` folder with proper structure:
  ```
  client/
  ├── index.html
  ├── userData.json
  ├── css/styles.css
  └── js/script.js
  ```

### 2. Upload to Zoho Catalyst

#### Method 1: Via Catalyst CLI

```bash
# Install Catalyst CLI
npm install -g catalyst-cli

# Login to your account
catalyst auth:login

# Initialize project
catalyst init

# Deploy static files
catalyst deploy --static
```

#### Method 2: Via Web Console

1. Login to [Zoho Catalyst Console](https://catalyst.zoho.com)
2. Create a new project or select existing
3. Go to "Client" section
4. Upload all files from the `client` folder
5. Set `index.html` as the main file

### 3. Configuration

- **Entry Point**: `index.html`
- **Static Hosting**: Enabled
- **Custom Domain**: Optional (available in paid plans)

### 4. Features Supported

✅ **Responsive Design**: Works on all devices
✅ **Offline Functionality**: Local storage for data persistence
✅ **Modern UI**: Clean, professional interface
✅ **Investment Tracking**: Stocks and mutual funds
✅ **User Authentication**: Login/signup system
✅ **Portfolio Management**: Add, edit, delete investments

### 5. Free Tier Limitations

- 1GB storage
- 5GB bandwidth per month
- Custom domain not available
- Limited compute resources

### 6. Post-Deployment

- Test all functionality
- Verify responsive design
- Check data persistence
- Test form validations

## Support

For deployment issues, refer to [Zoho Catalyst Documentation](https://www.zoho.com/catalyst/help/)
