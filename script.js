// Pixel Art Stock Chart Animation
// Charts respond to mouse Y position - move mouse up = stocks go up, move down = stocks go down

class PixelStockChart {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.charts = [];
        this.mouseY = 0.5; // Normalized 0-1, 0.5 = center
        this.targetMouseY = 0.5;
        this.pixelSize = 4;
        this.time = 0;
        
        this.resize();
        this.initCharts();
        this.bindEvents();
        this.animate();
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    initCharts() {
        // Create multiple stock chart lines with different properties
        const chartConfigs = [
            { color: '#00ff88', speed: 0.02, amplitude: 80, offset: 0, opacity: 0.6 },
            { color: '#00cc66', speed: 0.015, amplitude: 60, offset: 100, opacity: 0.4 },
            { color: '#ff4444', speed: 0.025, amplitude: 70, offset: 200, opacity: 0.5 },
            { color: '#ff6666', speed: 0.018, amplitude: 50, offset: 300, opacity: 0.3 },
            { color: '#44aaff', speed: 0.022, amplitude: 65, offset: 150, opacity: 0.35 },
            { color: '#00ff88', speed: 0.012, amplitude: 90, offset: 250, opacity: 0.25 },
        ];
        
        this.charts = chartConfigs.map(config => ({
            ...config,
            points: this.generateInitialPoints(config),
            baseY: this.canvas.height * 0.5
        }));
    }
    
    generateInitialPoints(config) {
        const points = [];
        const numPoints = Math.ceil(this.canvas.width / this.pixelSize) + 50;
        
        for (let i = 0; i < numPoints; i++) {
            points.push({
                x: i * this.pixelSize,
                y: 0,
                targetY: 0
            });
        }
        return points;
    }
    
    bindEvents() {
        window.addEventListener('resize', () => {
            this.resize();
            this.initCharts();
        });
        
        window.addEventListener('mousemove', (e) => {
            // Invert: mouse at top (0) = stocks go up (negative Y offset)
            this.targetMouseY = 1 - (e.clientY / window.innerHeight);
        });
        
        window.addEventListener('touchmove', (e) => {
            if (e.touches.length > 0) {
                this.targetMouseY = 1 - (e.touches[0].clientY / window.innerHeight);
            }
        });
    }
    
    updateCharts() {
        // Smooth mouse following
        this.mouseY += (this.targetMouseY - this.mouseY) * 0.05;
        
        // Mouse influence on chart direction (-1 to 1, where 1 = going up)
        const mouseInfluence = (this.mouseY - 0.5) * 2;
        
        this.charts.forEach((chart, chartIndex) => {
            // Shift points left (scrolling effect)
            for (let i = 0; i < chart.points.length - 1; i++) {
                chart.points[i].y = chart.points[i + 1].y;
            }
            
            // Generate new point at the end
            const lastPoint = chart.points[chart.points.length - 1];
            const baseWave = Math.sin(this.time * chart.speed + chart.offset) * chart.amplitude * 0.3;
            const noise = (Math.random() - 0.5) * 20;
            
            // Mouse influence creates trend direction
            const trend = mouseInfluence * chart.amplitude * 1.5;
            
            // Combine all factors
            const newY = baseWave + noise + trend;
            lastPoint.y = newY;
        });
        
        this.time++;
    }
    
    drawPixelLine(points, color, opacity, baseY) {
        this.ctx.fillStyle = color;
        this.ctx.globalAlpha = opacity;
        
        // Draw pixelated line
        for (let i = 1; i < points.length; i++) {
            const x1 = points[i - 1].x;
            const y1 = baseY + points[i - 1].y;
            const x2 = points[i].x;
            const y2 = baseY + points[i].y;
            
            // Bresenham-style pixelated line
            const dx = Math.abs(x2 - x1);
            const dy = Math.abs(y2 - y1);
            const sx = x1 < x2 ? this.pixelSize : -this.pixelSize;
            const sy = y1 < y2 ? this.pixelSize : -this.pixelSize;
            let err = dx - dy;
            let x = x1;
            let y = y1;
            
            while (true) {
                // Draw pixel
                const pixelX = Math.floor(x / this.pixelSize) * this.pixelSize;
                const pixelY = Math.floor(y / this.pixelSize) * this.pixelSize;
                this.ctx.fillRect(pixelX, pixelY, this.pixelSize, this.pixelSize);
                
                if (Math.abs(x - x2) < this.pixelSize && Math.abs(y - y2) < this.pixelSize) break;
                
                const e2 = 2 * err;
                if (e2 > -dy) {
                    err -= dy;
                    x += sx;
                }
                if (e2 < dx) {
                    err += dx;
                    y += sy;
                }
            }
        }
        
        this.ctx.globalAlpha = 1;
    }
    
    drawCandlesticks(chart) {
        const candleWidth = this.pixelSize * 3;
        const spacing = this.pixelSize * 8;
        
        for (let i = spacing; i < chart.points.length - spacing; i += spacing) {
            const open = chart.points[i - 2]?.y || 0;
            const close = chart.points[i + 2]?.y || 0;
            const high = Math.min(open, close) - Math.random() * 15;
            const low = Math.max(open, close) + Math.random() * 15;
            
            const x = chart.points[i].x;
            const baseY = chart.baseY;
            
            // Determine if bullish or bearish
            const isBullish = close < open; // In canvas, lower Y = higher price
            const color = isBullish ? '#00ff88' : '#ff4444';
            
            this.ctx.fillStyle = color;
            this.ctx.globalAlpha = chart.opacity * 0.5;
            
            // Draw wick (high to low)
            const wickX = Math.floor(x / this.pixelSize) * this.pixelSize + this.pixelSize;
            const wickTop = Math.floor((baseY + high) / this.pixelSize) * this.pixelSize;
            const wickBottom = Math.floor((baseY + low) / this.pixelSize) * this.pixelSize;
            
            for (let wy = wickTop; wy <= wickBottom; wy += this.pixelSize) {
                this.ctx.fillRect(wickX, wy, this.pixelSize, this.pixelSize);
            }
            
            // Draw body
            const bodyTop = Math.floor((baseY + Math.min(open, close)) / this.pixelSize) * this.pixelSize;
            const bodyBottom = Math.floor((baseY + Math.max(open, close)) / this.pixelSize) * this.pixelSize;
            const bodyX = Math.floor(x / this.pixelSize) * this.pixelSize;
            
            for (let by = bodyTop; by <= bodyBottom; by += this.pixelSize) {
                for (let bx = bodyX; bx < bodyX + candleWidth; bx += this.pixelSize) {
                    this.ctx.fillRect(bx, by, this.pixelSize, this.pixelSize);
                }
            }
        }
        
        this.ctx.globalAlpha = 1;
    }
    
    drawGrid() {
        this.ctx.fillStyle = '#1a3a2a';
        this.ctx.globalAlpha = 0.3;
        
        const gridSize = this.pixelSize * 20;
        
        // Horizontal lines
        for (let y = 0; y < this.canvas.height; y += gridSize) {
            for (let x = 0; x < this.canvas.width; x += this.pixelSize * 2) {
                this.ctx.fillRect(x, y, this.pixelSize, this.pixelSize);
            }
        }
        
        // Vertical lines
        for (let x = 0; x < this.canvas.width; x += gridSize) {
            for (let y = 0; y < this.canvas.height; y += this.pixelSize * 2) {
                this.ctx.fillRect(x, y, this.pixelSize, this.pixelSize);
            }
        }
        
        this.ctx.globalAlpha = 1;
    }
    
    drawPriceLabels() {
        this.ctx.font = `${this.pixelSize * 3}px "Press Start 2P", monospace`;
        this.ctx.fillStyle = '#00ff88';
        this.ctx.globalAlpha = 0.4;
        
        const prices = ['$420.69', '$350.00', '$280.00', '$210.00', '$140.00'];
        const spacing = this.canvas.height / (prices.length + 1);
        
        prices.forEach((price, i) => {
            const y = spacing * (i + 1);
            this.ctx.fillText(price, 10, y);
        });
        
        this.ctx.globalAlpha = 1;
    }
    
    render() {
        // Clear with dark background
        this.ctx.fillStyle = '#0a0f0d';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid
        this.drawGrid();
        
        // Draw price labels
        this.drawPriceLabels();
        
        // Draw each chart
        this.charts.forEach((chart, index) => {
            // Draw candlesticks for first two charts
            if (index < 2) {
                this.drawCandlesticks(chart);
            }
            
            // Draw line
            this.drawPixelLine(chart.points, chart.color, chart.opacity, chart.baseY);
        });
        
        // Draw mouse indicator
        this.drawMouseIndicator();
    }
    
    drawMouseIndicator() {
        const indicatorY = this.canvas.height * (1 - this.mouseY);
        const indicatorX = this.canvas.width - 60;
        
        // Draw horizontal line
        this.ctx.fillStyle = '#ffff00';
        this.ctx.globalAlpha = 0.3;
        
        for (let x = indicatorX; x < this.canvas.width; x += this.pixelSize * 2) {
            this.ctx.fillRect(x, indicatorY, this.pixelSize, this.pixelSize);
        }
        
        // Draw arrow
        const arrowDir = this.mouseY > 0.5 ? -1 : 1;
        const arrowColor = this.mouseY > 0.5 ? '#00ff88' : '#ff4444';
        this.ctx.fillStyle = arrowColor;
        this.ctx.globalAlpha = 0.6;
        
        for (let i = 0; i < 3; i++) {
            const size = (3 - i) * this.pixelSize;
            const offsetY = i * this.pixelSize * arrowDir * 2;
            this.ctx.fillRect(
                this.canvas.width - 30 - size / 2,
                indicatorY + offsetY - this.pixelSize / 2,
                size,
                this.pixelSize
            );
        }
        
        this.ctx.globalAlpha = 1;
    }
    
    animate() {
        this.updateCharts();
        this.render();
        requestAnimationFrame(() => this.animate());
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('stockCanvas');
    if (canvas) {
        new PixelStockChart(canvas);
    }
});

// Add glitch effect to profile image on hover
const profileImg = document.getElementById('profileImg');
if (profileImg) {
    profileImg.addEventListener('mouseenter', () => {
        profileImg.style.filter = 'hue-rotate(90deg) saturate(2)';
        setTimeout(() => {
            profileImg.style.filter = 'hue-rotate(180deg) saturate(1.5)';
        }, 100);
        setTimeout(() => {
            profileImg.style.filter = 'none';
        }, 200);
    });
}

// Ticker animation
const tickerContent = document.querySelector('.ticker-content');
if (tickerContent) {
    // Clone content for seamless loop
    tickerContent.innerHTML += tickerContent.innerHTML;
}
