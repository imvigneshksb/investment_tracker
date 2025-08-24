# Investment Tracker

A modern, responsive HTML-based investment tracking website with offline-first design and local data persistence.

## 🌟 Features

- **Offline-First Design**: Works without internet connectivity
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices
- **Dark/Light Theme**: Toggle between themes with persistence using localStorage
- **Smooth Animations**: All interactions include smooth transitions and hover effects
- **Interactive Chart**: Canvas-based investment growth visualization with time period controls
- **Modern UI**: Clean interface with rounded corners and smooth gradients
- **User Authentication**: Full user authentication with validation and signup
- **Portfolio Tracking**: Local portfolio management with data persistence
- **Local Data Storage**: All data stored locally using localStorage and file system
- **Single Column Layout**: Clean, linear flow of information
- **No External Dependencies**: Removed all external API dependencies for improved reliability

## 🌐 Deployment Options

### 🎯 Zoho Catalyst (Recommended for Production)

**Ready for Zoho Catalyst free tier deployment!**

1. **Install Zoho CLI**:

   ```bash
   npm install -g @zohocorp/cli
   ```

2. **Login to Zoho**:

   ```bash
   zcli auth login
   ```

3. **Initialize and Deploy**:

   ```bash
   cd investment-tracker
   zcli init
   zcli deploy
   ```

4. **Access your app**:
   - Your app will be available at: `https://your-app-name-<project-id>.catalyst.zoho.com`

📖 **Detailed deployment guide**: See `DEPLOYMENT.md`

### 🏠 Local Development

#### Option 1: Express Server (Zoho Compatible)

#### Option 1: Express Server (Zoho Compatible)

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Start the server**:

   ```bash
   npm start
   # Or manually:
   node app.js
   ```

3. **Access the website**:
   - Open your browser and go to: `http://localhost:9000`

#### Option 2: Legacy Node.js Server

1. **Start the legacy server**:

   ```bash
   # Windows
   double-click start-server.bat

   # Or run manually:
   node server.js
   ```

   node server.js

   ````

   ```bash
   # Linux/macOS/Git Bash
   chmod +x start-server.sh
   ./start-server.sh

   # Or run manually:
   node server.js
   ````

2. **Access the website**:
   - Open your browser and go to: `http://localhost:8080`

### Option 2: Python Server

1. **Start Python server**:

   ```bash
   # Python 3
   python -m http.server 8080

   # Python 2
   python -m SimpleHTTPServer 8080
   ```

2. **Access the website**:
   - Open your browser and go to: `http://localhost:8080`

### Option 3: PHP Server

1. **Start PHP server** (requires PHP installed):

   ```bash
   php -S localhost:8080
   ```

2. **Access the website**:
   - Open your browser and go to: `http://localhost:8080`

### Option 4: Direct File Access

1. **Open directly in browser**:
   - Simply double-click `index.html`
   - Or drag and drop the file into your browser

## 📁 Project Structure

```
investment_tracker/
├── index.html              # Main HTML file
├── styles.css              # CSS styles with theme support
├── script.js               # JavaScript functionality
├── app.js                  # Express server for Zoho Catalyst
├── server.js               # Legacy Node.js local server
├── package.json            # Project configuration
├── catalyst.json           # Zoho Catalyst configuration
├── .catalystrc             # Zoho Catalyst settings
├── Procfile                # Process configuration
├── DEPLOYMENT.md           # Zoho Catalyst deployment guide
├── start-server.bat        # Windows startup script
├── start-server.sh         # Linux/macOS startup script
└── README.md              # This documentation
```

## 🔌 API Endpoints

When using the Express server (`app.js`), the following API endpoints are available:

- **GET** `/` - Main website
- **GET** `/api/health` - Health check endpoint
- **GET** `/api/portfolio` - Portfolio data (JSON)
- **GET** `/api/market` - Market indices data (JSON)

### API Examples:

```bash
# Health check
curl https://your-app.catalyst.zoho.com/api/health

# Get portfolio data
curl https://your-app.catalyst.zoho.com/api/portfolio

# Get market data
curl https://your-app.catalyst.zoho.com/api/market
```

## 🎯 Getting Started

### For Zoho Catalyst Deployment:

1. **Follow the deployment guide** in `DEPLOYMENT.md`
2. **Deploy to Zoho Catalyst** using the CLI
3. **Access your live website**

### For Local Development:

1. **Clone or download** this repository
2. **Choose a hosting method** from the options above
3. **Start the server** using your preferred method
4. **Open your browser** and navigate to `http://localhost:8080`
5. **Enjoy!** The website will load with the light theme by default

## 🎨 Usage

### Theme System

- Click the **"Dark"** button to switch to dark mode
- Click **"Light"** to switch back to light mode
- Theme preference is automatically saved and restored

### Interactive Elements

- **Login Form**: Complete user registration and authentication system
- **Time Period Buttons**: Click 1W, 1M, 3M, 1Y, or ALL to change chart data
- **Navigation Buttons**: Portfolio, Analytics, and Settings sections
- **Hover Effects**: All cards and buttons have smooth hover animations

### Chart Visualization

- Interactive line chart showing investment growth
- Responsive design that adapts to container size
- Time period controls to view different data ranges
- Professional grid lines and gradient fills
- Responsive design that adapts to container size
- Gradient fill for enhanced visual appeal

## Browser Compatibility

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Customization

You can easily customize:

- Colors by modifying CSS custom properties in `:root` and `[data-theme="dark"]`
- Chart data by updating the `dataPoints` array in `script.js`
- Layout by adjusting the CSS grid and flexbox properties

## License

This project is open source and available under the MIT License.
