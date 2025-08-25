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

## 📁 Project Structure

```
investment_tracker/
├── client/                    # 🎯 Production-ready deployment folder
│   ├── index.html            # Main application
│   ├── userData.json         # User data storage
│   ├── css/
│   │   └── styles.css        # All styling
│   ├── js/
│   │   └── script.js         # All JavaScript functionality
│   └── README.md             # Client documentation
├── server.js                 # Node.js server (optional)
├── DEPLOYMENT.md             # Deployment guide
└── README.md                 # This file
```

## 🌐 Deployment Options

### 🎯 Zoho Catalyst (Recommended for Production)

**Ready for Zoho Catalyst free tier deployment!**

1. **Upload the `client` folder contents** to Zoho Catalyst
2. **Set `index.html` as entry point**
3. **Deploy using Zoho CLI or Web Console**

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

1. **Start Python server** (from client folder):

   ```bash
   cd client
   # Python 3
   python -m http.server 8080

   # Python 2
   python -m SimpleHTTPServer 8080
   ```

2. **Access the website**:
   - Open your browser and go to: `http://localhost:8080`

### Option 3: PHP Server

1. **Start PHP server** (from client folder):

   ```bash
   cd client
   php -S localhost:8080
   ```

2. **Access the website**:
   - Open your browser and go to: `http://localhost:8080`

### Option 4: Direct File Access

1. **Open directly in browser**:
   - Navigate to the `client` folder
   - Double-click `index.html`
   - Or drag and drop the `client/index.html` file into your browser

## API Endpoints

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
