/**
 * The row CreativeAttentionPage inserts, built in one place so a Node check
 * can execute it.
 *
 * Two things this guarantees:
 *   1. The audience goes to ca_target_audience, never to the shared
 *      target_audience JSONB. That column holds an object on every other
 *      mission type, and a Creative Attention mission holding the object form
 *      used to tell the analysis its audience was "[object Object]".
 *   2. The placement is one the uploaded format can honestly be scored for,
 *      checked against the same list the server serves and the analysis
 *      validates (GET /api/creative-attention/options). A still image cannot
 *      be sent with a TV placement.
 */

export const CA_AUDIENCE_MAX_LENGTH = 1000;

/** The placements offered for an upload. image -> image formats; anything else is treated as video. */
export function placementsForUpload(placements, mediaType) {
  const kind = mediaType === 'image' ? 'image' : 'video';
  return (Array.isArray(placements) ? placements : []).filter((p) => Array.isArray(p.formats) && p.formats.includes(kind));
}

const clean = (v) => (typeof v === 'string' && v.trim() ? v.trim() : null);

export function buildCaMissionInsert({
  userId, brandName, description, respondentCount, tier, mediaType, mediaUrl,
  targetAudience, placementId, marketCode, desiredEmotions, keyMessage, briefAttachment,
  placements,
}) {
  const offered = placementsForUpload(placements, mediaType);
  if (!offered.some((p) => p.id === placementId)) {
    throw new Error('Choose where this creative will run.');
  }
  const audience = clean(targetAudience);
  return {
    user_id:            userId,
    title:              `Creative Attention: ${String(brandName).trim()}`,
    brief:              typeof description === 'string' ? description.trim() : '',
    goal_type:          'creative_attention',
    status:             'draft',
    respondent_count:   respondentCount,
    price_estimated:    tier.packagePrice,
    tier:               tier.id,
    media_type:         mediaType,
    media_url:          mediaUrl || null,
    brand_name:         String(brandName).trim(),
    ca_target_audience: audience ? audience.slice(0, CA_AUDIENCE_MAX_LENGTH) : null,
    ca_placement:       placementId,
    ca_market:          clean(marketCode),
    desired_emotions:   desiredEmotions && desiredEmotions.length ? [...desiredEmotions] : null,
    key_message:        clean(keyMessage),
    brief_attachment:   briefAttachment,
  };
}
