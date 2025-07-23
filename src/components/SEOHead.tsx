import { useEffect } from 'react';

interface SEOHeadProps {
    title?: string;
    description?: string;
    keywords?: string[];
    image?: string;
    url?: string;
    type?: 'website' | 'article' | 'video' | 'product';
    author?: string;
    publishedTime?: string;
    modifiedTime?: string;
}

/**
 * SEO Head Component - Manages document head for search engine optimization
 * 
 * Handles meta tags, Open Graph, Twitter Cards, and structured data
 * for maximum search visibility and social media sharing
 */
export const SEOHead: React.FC<SEOHeadProps> = ({
    title = 'AI Story Studio - Professional Cinematic Story Creation Platform',
    description = 'Create professional stories, storyboards, and cinematic content with AI-powered tools. Built for directors, actors, and content creators.',
    keywords = ['AI', 'story creation', 'storyboard', 'cinematic', 'filmmaking', 'script writing', 'video production', 'artificial intelligence'],
    image = '/og-image.jpg',
    url = 'https://ai-story-studio.com',
    type = 'website',
    author = 'AI Story Studio Team',
    publishedTime,
    modifiedTime
}) => {
    useEffect(() => {
        // Set document title
        document.title = title;

        // Helper function to update meta tags
        const updateMetaTag = (name: string, content: string, property?: boolean) => {
            const selector = property ? `meta[property="${name}"]` : `meta[name="${name}"]`;
            let tag = document.querySelector(selector) as HTMLMetaElement;

            if (!tag) {
                tag = document.createElement('meta');
                if (property) {
                    tag.setAttribute('property', name);
                } else {
                    tag.setAttribute('name', name);
                }
                document.head.appendChild(tag);
            }
            tag.setAttribute('content', content);
        };

        // Basic meta tags
        updateMetaTag('description', description);
        updateMetaTag('keywords', keywords.join(', '));
        updateMetaTag('author', author);
        updateMetaTag('robots', 'index, follow');
        updateMetaTag('viewport', 'width=device-width, initial-scale=1.0');

        // Open Graph meta tags
        updateMetaTag('og:title', title, true);
        updateMetaTag('og:description', description, true);
        updateMetaTag('og:image', image, true);
        updateMetaTag('og:url', url, true);
        updateMetaTag('og:type', type, true);
        updateMetaTag('og:site_name', 'AI Story Studio', true);

        // Twitter Card meta tags
        updateMetaTag('twitter:card', 'summary_large_image');
        updateMetaTag('twitter:title', title);
        updateMetaTag('twitter:description', description);
        updateMetaTag('twitter:image', image);

        // Article specific meta tags
        if (type === 'article' && publishedTime) {
            updateMetaTag('article:published_time', publishedTime, true);
        }
        if (type === 'article' && modifiedTime) {
            updateMetaTag('article:modified_time', modifiedTime, true);
        }

        // Canonical URL
        let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
        if (!canonicalLink) {
            canonicalLink = document.createElement('link');
            canonicalLink.setAttribute('rel', 'canonical');
            document.head.appendChild(canonicalLink);
        }
        canonicalLink.setAttribute('href', url);

        // Structured Data JSON-LD
        const structuredData = {
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "AI Story Studio",
            "description": description,
            "url": url,
            "applicationCategory": "MultimediaApplication",
            "operatingSystem": "Web Browser",
            "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
            },
            "creator": {
                "@type": "Organization",
                "name": "AI Story Studio Team"
            },
            "featureList": [
                "AI-powered story generation",
                "Storyboard creation",
                "Cinematic planning tools",
                "Character development",
                "Scene visualization",
                "Video pre-production"
            ]
        };

        let jsonLdScript = document.querySelector('script[type="application/ld+json"]');
        if (!jsonLdScript) {
            jsonLdScript = document.createElement('script');
            jsonLdScript.setAttribute('type', 'application/ld+json');
            document.head.appendChild(jsonLdScript);
        }
        jsonLdScript.textContent = JSON.stringify(structuredData);

    }, [title, description, keywords, image, url, type, author, publishedTime, modifiedTime]);

    return null; // This component doesn't render anything visible
};
