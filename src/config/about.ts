/**
 * Fill in the values below before publishing.
 * Placeholders contain brackets so the app can warn if they are still unset.
 */
export const ABOUT_CONFIG = {
    /** Shown in copyright line, e.g. "Mark P" or "Your Company Ltd" */
    publisherName: "Pearsonality Ltd",

    /** Year for © notice */
    copyrightYear: "2026",

    /** Support email — used for "Contact support" (mailto:) */
    supportEmail: "support@pearsonality.com",

    /**
     * Public URL to your privacy policy (GitHub Pages, Notion, etc.).
     * Required for App Store / Play Store listings.
     */
    privacyPolicyUrl: "[YOUR PRIVACY POLICY URL]",

    /**
     * Optional terms of use URL. Leave as empty string to hide the menu row.
     */
    termsOfUseUrl: "",

    /**
     * Optional marketing or project website. Leave empty to hide.
     */
    websiteUrl: "",

    /** Shown on About and should match your published policy */
    privacyPolicyEffectiveDate: "18 May 2026",
};

export function isAboutPlaceholder(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return true;
    return trimmed.includes("[") || trimmed.includes("YOUR");
}
