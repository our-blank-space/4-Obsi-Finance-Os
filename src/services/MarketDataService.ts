
interface MarketData {
    price: number;
    source: 'Binance' | 'CoinGecko' | 'Fallback';
}

export const MarketDataService = {
    /**
     * Normalizes a symbol for crypto APIs (e.g., "BTC" -> "BTCUSDT")
     */
    normalizeSymbol: (symbol: string): string => {
        const clean = symbol.toUpperCase().replace(/[^A-Z0-9]/g, '');
        // If it already ends in USDT or USD, leave it (mostly), otherwise append USDT for Binance
        if (clean.endsWith('USDT')) return clean;
        if (clean.endsWith('USD')) return clean.replace('USD', 'USDT');
        return `${clean}USDT`;
    },

    /**
     * Fetches current price from Binance Public API (Free, no key required for simple tickers)
     */
    getPrice: async (symbol: string): Promise<number | null> => {
        try {
            const pair = MarketDataService.normalizeSymbol(symbol);
            const response = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${pair}`);

            if (!response.ok) {
                // Try basic "USD" suffix if USDT fails? Rare, but possible.
                // For now, just return null to indicate failure.
                console.warn(`[MarketData] Binance error for ${pair}: ${response.status}`);
                return null;
            }

            const data = await response.json();
            // Expected format: { "symbol": "BTCUSDT", "price": "60000.00" }
            if (data.price) {
                return parseFloat(data.price);
            }
            return null;

        } catch (error) {
            console.error(`[MarketData] Fetch error for ${symbol}:`, error);
            return null;
        }
    },

    /**
     * FUTURE: Add CoinGecko or other fallbacks here if Binance fails.
     * CoinGecko requires mapping symbols (BTC) to IDs (bitcoin), which is complex without a local map.
     */
};
