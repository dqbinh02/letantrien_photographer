declare module "*.css" {
    const content: { [className: string]: string };
    export default content;
}

declare module "*.scss" {
    const content: { [className: string]: string };
    export default content;
}

// Specific CSS module declarations
declare module "@once-ui-system/core/css/styles.css";
declare module "@once-ui-system/core/css/tokens.css";
declare module "@/resources/custom.css";
