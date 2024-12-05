class Gradient {
    constructor(stops) {
        this.stops = stops;
        
        this.sortStops();
    }
    
    // Sorts the stops in the Gradient by their position
    sortStops() {
        this.stops.sort((a, b) => a.position - b.position);
    }

    clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    // Gets a point along the gradient (using a factor of 0-1)
    getColorAtPoint(factor) {
        // Clamp the factor
        factor = this.clamp(factor, 0, 1);

        // Find the two gradient stops surrounding the factor
        let startStop, endStop;
        for (let i = 0; i < this.stops.length - 1; i++) {
            if (factor >= this.stops[i].position && factor <= this.stops[i + 1].position) {
                startStop = this.stops[i];
                endStop = this.stops[i + 1];
                break;
            }
        }

        if (!startStop || !endStop) {
            // If factor is exactly 0 or 1, return the first or last stop
            return factor === 0 ? this.stops[0] : this.stops[this.stops.length - 1];
        }

        // Calculate interpolation factor between the two stops
        const range = endStop.position - startStop.position;
        const t = (factor - startStop.position) / range;

        // Interpolate each color channel (R, G, B, A)
        const r = Math.round(startStop.color.r + t * (endStop.color.r - startStop.color.r));
        const g = Math.round(startStop.color.g + t * (endStop.color.g - startStop.color.g));
        const b = Math.round(startStop.color.b + t * (endStop.color.b - startStop.color.b));
        const a = startStop.color.a + t * (endStop.color.a - startStop.color.a);

        // Return the interpolated color as a new GradientStop
        const interpolatedColor = new Color(`rgba(${r},${g},${b},${a})`);
        return new GradientStop(interpolatedColor, factor);
    }
}

class GradientStop {
    constructor(color, position) {
        this.color = color;
        this.position = position;
    }
}

class Color {
    constructor(color) {
        if (color.startsWith('#')) {
            // Parse hex format
            const hex = color.slice(1);
            if (hex.length === 3) {
                // Expand shorthand hex (#RGB to #RRGGBB)
                this.r = parseInt(hex[0] + hex[0], 16);
                this.g = parseInt(hex[1] + hex[1], 16);
                this.b = parseInt(hex[2] + hex[2], 16);
                this.a = 1; // Default alpha for hex is 1 (opaque)
            } else if (hex.length === 6) {
                this.r = parseInt(hex.slice(0, 2), 16);
                this.g = parseInt(hex.slice(2, 4), 16);
                this.b = parseInt(hex.slice(4, 6), 16);
                this.a = 1; // Default alpha for hex is 1 (opaque)
            } else {
                throw new Error('Invalid hex color format');
            }
        } else if (color.startsWith('rgba(')) {
            // Parse rgba() format
            const match = color.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*(\d+(\.\d+)?)\)/);
            if (match) {
                this.r = parseInt(match[1], 10);
                this.g = parseInt(match[2], 10);
                this.b = parseInt(match[3], 10);
                this.a = parseFloat(match[4]);
            } else {
                throw new Error('Invalid rgba() color format');
            }
        } else {
            throw new Error('Unsupported color format');
        }
    }
}
