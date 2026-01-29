/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./src/**/*.{js,jsx,ts,tsx}"],
    presets: [require("nativewind/preset")],
    theme: {
        extend: {
            colors: {
                primary: "#7CFF00",
                "primary-dark": "#5ECC00",

                background: "#0F0F0F",
                surface: "#1A1A1A",

                text: {
                    primary: "#FFFFFF",
                    secondary: "#B3B3B3",
                },

                border: "#2A2A2A",
                danger: "#FF3B3B",
            },
            fontFamily: {
                inter: ["Inter_400Regular"],
                interMedium: ["Inter_500Medium"],
                interBold: ["Inter_700Bold"],

                montBold: ["Montserrat_700Bold"],
                montExtra: ["Montserrat_800ExtraBold"],
            },
        },
    },

    plugins: [],
};
