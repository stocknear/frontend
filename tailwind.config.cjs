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
				  'fade-in-once': 'fadeIn 0.5s cubic-bezier(0.165, 0.84, 0.44, 1) forwards',
			  },
			  keyframes: {
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
  
  