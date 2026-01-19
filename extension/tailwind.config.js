/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{tsx,ts,jsx,js}"],
  theme: {
    extend: {
      colors: {
        // Primary Palette
        forest: {
          DEFAULT: "#2c5f2d",
          deep: "#234a24"
        },
        fresh: "#97c04c",
        sage: "#5d8a3a",

        // Accent Palette
        terracotta: "#f4a259",
        clay: "#e76f51",

        // Neutrals
        charcoal: "#1a1a1a",
        graphite: "#2d2d2d",
        slate: "#3a3a3a",
        stone: "#666666"
      },
      backgroundImage: {
        "gradient-primary": "linear-gradient(135deg, #2c5f2d 0%, #97c04c 100%)",
        "gradient-success": "linear-gradient(135deg, #5d8a3a 0%, #97c04c 100%)",
        "gradient-warm": "linear-gradient(135deg, #e76f51 0%, #f4a259 100%)"
      },
      boxShadow: {
        "card": "0 4px 12px rgba(44, 95, 45, 0.15)",
        "card-hover": "0 8px 24px rgba(44, 95, 45, 0.2)"
      },
      animation: {
        "fade-in": "fadeIn 0.2s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
        "grow": "grow 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" }
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        grow: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" }
        }
      }
    }
  },
  plugins: []
}
