/** @type {import('tailwindcss').Config} */




module.exports = {
	content: ['./src/**/*.{html,js,svelte,ts}',
	"./node_modules/flowbite-svelte/**/*.{html,js,svelte,ts}",],
	theme: {
	  extend: {
			  fraction: {
				  32: '1/32',
			  },
			  animation: {
				marquee: "marquee var(--duration) linear infinite",
				'fade-in-once': 'fadeIn 0.5s cubic-bezier(0.165, 0.84, 0.44, 1) forwards',
				'flip': "flip 6s infinite steps(2, end)",
	            "kitrotate": "kitrotate 3s linear infinite both",
	            shine: "shine 4s linear infinite",
	            slide: "slide 40s linear infinite",
	            spotlight: "spotlight 2s ease .75s 1 forwards",
	            "border-width": "border-width 3s infinite alternate",
	            "text-gradient": "text-gradient 2s linear infinite",
	            "text-shake": "text-shake 1s ease 1",
	            "text-glitch-to": "text-glitch-to 0.6s ease-in-out infinite",
	            "text-glitch-from": "text-glitch-from 0.6s ease-in-out infinite",
	            "text-scale": "text-scale 1s linear infinite forwards",
	            'spin': 'spin 2s linear infinite',
				// From UI-Snippets : https://ui.ibelick.com
				// 'text-gradient': 'text-gradient 1.5s linear infinite',
				'background-shine': 'background-shine 2s linear infinite',
				'pulse-slow': 'pulse 6s infinite cubic-bezier(0.4, 0, 0.6, 1)',
			  },
			  keyframes: {
				marquee: {
					from: { transform: "translateX(0)" },
					to: { transform: "translateX(calc(-100% - var(--gap)))" },
				  },
				  fadeIn: {
					  '0%': {
						opacity: '0',
						transform: 'translateY(5px) scale(0.98)',
					  },
					  '100%': {
						opacity: '1',
						transform: 'translateY(0) scale(1)',
					  },
					},
					spin: {
						'0%': { transform: 'rotate(0deg)' },
						'100%': { transform: 'rotate(360deg)' },
					},
					"flip": {
						"to": {
							"transform": "rotate(360deg)",
						},
					},
					"kitrotate": {
						"to": {
							"transform": "rotate(90deg)",
						},
					},
					shine: {
						from: {
							backgroundPosition: "0 0",
						},
						to: {
							backgroundPosition: "-200% 0",
						},
					},
					"border-width": {
						from: {
							width: "10px",
							opacity: "0",
						},
						to: {
							width: "100px",
							opacity: "1",
						},
					},
					"text-gradient": {
						to: {
							backgroundPosition: "200% center",
						},
					},
					"text-shake": {
						"15%": { transform: "translateX(5px)" },
						"30%": { transform: "translateX(-5px)" },
						"50%": { transform: "translateX(3px)" },
						"80%": { transform: "translateX(2px)" },
						"100%": { transform: "translateX(0)" },
					},
					"text-glitch-to": {
						from: {
							transform: "translateY(0)",
						},
						to: {
							transform: "translateY(-100%)",
						},
					},
					"text-glitch-from": {
						from: {
							transform: "translateY(100%)",
						},
						to: {
							transform: "translateY(0)",
						},
					},
					"text-scale": {
						"0%": {
							transform: "scaleX(0)",
							transformOrigin: "bottom left",
						},
						"25%": {
							transform: "scaleX(1)",
							transformOrigin: "bottom left",
						},
						"75%": {
							transform: "scaleX(1)",
							transformOrigin: "bottom right",
						},
						"100%": {
							transform: "scaleX(0)",
							transformOrigin: "bottom right",
						},
					},
					slide: {
						from: { transform: "translateX(0)" },
						to: { transform: "translateX(calc(-100% - var(--gap)))" },
					},
					spotlight: {
						"0%": {
							opacity: "0",
							transform: "translate(-72%, -62%) scale(0.5)",
						},
						"100%": {
							opacity: "1",
							transform: "translate(-50%,-40%) scale(1)",
						},
					},
					// For Gradient Input, UI-Snippets : https://ui.ibelick.com
					'background-shine': {
						from: { backgroundPosition: '0 0' },
						to: { backgroundPosition: '-200% 0' },
					},
			  },

			  
		  },
	},
	plugins: [require('flowbite/plugin'), require('daisyui')],
	darkMode: 'class',
	daisyui: {
	  themes: false, // true: all themes | false: only light + dark | array: specific themes like this ["light", "dark", "cupcake"]
	  darkTheme: "dark", // name of one of the included themes for dark mode
	  base: true, // applies background color and foreground color for root element by default
	  styled: true, // include daisyUI colors and design decisions for all components
	  utils: true, // adds responsive and modifier utility classes
	  rtl: false, // rotate style direction from left-to-right to right-to-left. You also need to add dir="rtl" to your html tag and install `tailwindcss-flip` plugin for Tailwind CSS.
	  prefix: "", // prefix for daisyUI classnames (components, modifiers and responsive class names. Not colors)
	  logs: true, // Shows info about daisyUI version and used config in the console when building your CSS
	},
  };
  
  