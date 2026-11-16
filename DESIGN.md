# NOVEN design direction

Audience: older adults doing gentle exercise, yoga and meditation.

Use warm white, charcoal and grey, with orange as the shared accent. Light backgrounds use the supplied orange/peach/blush wallpaper fading into white. Dark backgrounds fade from muted burnt orange into charcoal.

Use large, heavy headings, generous spacing and short action labels. Keep supporting text readable and actions at least 48 points tall. Let content wrap and scroll; use a single column on narrow screens and side-by-side cards on wide screens. Avoid fixed-height text containers.

Glass surfaces have translucent fills, subtle borders and restrained shadows. Keep text crisp. Android versions before 12 use the inexpensive translucent fallback. No new animations in this design pass.

Home prioritizes Exercise, with Yoga and Meditation beside or below it. All activities remains accessible, including Wellness. Retain current settings and navigation. Do not introduce fabricated statistics or hidden UI merely to satisfy source-text tests.

First implementation: Home and web navigation styling. Other screens and session functionality follow in separate passes. Device verification remains necessary before calling the design cross-platform validated.

## Revised direction after user review

Home is light-only for this design iteration, regardless of the stored appearance preference. Use the supplied wallpaper directly without tint overlays or replacement gradients. Remove motivational slogans and activity descriptions. Use equally weighted frosted-white activity cards, large black names and short Start actions. No brown, peach-filled hero cards or decorative rings. Dark Home styling is deferred until the light design is approved.

## Current Home revision

The wallpaper is now recreated with static gradient code (no bitmap), preserving orange/red at the top, pink/peach through the middle and white below. NOVEN is centered in bundled Barlow Condensed Bold, also used for English activity names. Kannada retains the system font. Activities are full-width glass rows with visible borders and neutral shadows; the entire row navigates, with a single arrow and no repeated Start labels.

## Typography and composition revision

Remove Barlow Condensed. Bundle Inter Display ExtraBold for the central NOVEN wordmark and Inter Display Medium for activity labels, from the designer rsms/inter official 4.1 release with its license. Keep utility text quieter. Use a single frosted panel with divided clickable rows rather than three disconnected cards; retain a View all link for Wellness. Remove duplicate NOVEN branding from web navigation. Background now uses only orange, vermilion, peach and white layers, with no pink layer.

## Latest direction (November 16)

Light background remains unchanged. Dark gradient follows assets/design/backgrounddark.png: saturated orange and red fading into near-black, without muted brown. Light containers use white frost and restrained shadows; dark containers use white-tinted translucent glass with light text. Typography uses bundled Inter regular, semibold, bold and the existing italic Inter wordmark. All three exercise Start controls use black fills and white labels. User direction takes precedence over Apple Design and Impeccable defaults.
