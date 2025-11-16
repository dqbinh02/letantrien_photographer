// IMPORTANT: Replace with your own domain address
const baseURL: string = "http://localhost:3000";

// Routes configuration
const routes = {
  "/": true,
  "/album": false,
  "/albums": true,
  "/admin": true,
};

const display = {
  themeSwitcher: true,
};

// Import fonts
import { Montserrat } from "next/font/google";

const heading = Montserrat({
  variable: "--font-heading",
  subsets: ["latin"],
  display: "swap",
});

const body = Montserrat({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

const label = Montserrat({
  variable: "--font-label",
  subsets: ["latin"],
  display: "swap",
});

const code = Montserrat({
  variable: "--font-code",
  subsets: ["latin"],
  display: "swap",
});

const fonts = {
  heading: heading,
  body: body,
  label: label,
  code: code,
};

// Style customization
const style = {
  theme: "light", // dark | light | system
  neutral: "gray",
  brand: "cyan",
  accent: "red",
  solid: "contrast",
  solidStyle: "flat",
  border: "playful",
  surface: "translucent",
  transition: "all",
  scaling: "100",
};

const dataStyle = {
  variant: "gradient",
  mode: "categorical",
  height: 24,
  axis: {
    stroke: "var(--neutral-alpha-weak)",
  },
  tick: {
    fill: "var(--neutral-on-background-weak)",
    fontSize: 11,
    line: false,
  },
};

const effects = {
  mask: {
    cursor: false,
    x: 50,
    y: 0,
    radius: 100,
  },
  gradient: {
    display: false,
    opacity: 100,
    x: 50,
    y: 60,
    width: 100,
    height: 50,
    tilt: 0,
    colorStart: "accent-background-strong",
    colorEnd: "page-background",
  },
  dots: {
    display: true,
    opacity: 40,
    size: "2",
    color: "brand-background-strong",
  },
  grid: {
    display: false,
    opacity: 100,
    color: "neutral-alpha-medium",
    width: "0.25rem",
    height: "0.25rem",
  },
  lines: {
    display: false,
    opacity: 100,
    color: "neutral-alpha-weak",
    size: "16",
    thickness: 1,
    angle: 45,
  },
};

export {
  display,
  routes,
  baseURL,
  fonts,
  style,
  effects,
  dataStyle,
};
