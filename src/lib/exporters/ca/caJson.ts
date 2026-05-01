import type { CAExportMission } from './caTypes';
import { triggerDownload, exportFilename } from './caShared';

export function exportCreativeAttentionJson(mission: CAExportMission): void {
  const payload = {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    mission: {
      id: mission.id,
      title: mission.title ?? null,
      brief: mission.brief ?? null,
      mission_statement: mission.mission_statement ?? null,
      media_url: mission.media_url ?? null,
      media_type: mission.media_type ?? null,
      completed_at: mission.completed_at ?? null,
    },
    creative_analysis: mission.creative_analysis,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json;charset=utf-8',
  });
  triggerDownload(blob, exportFilename(mission, 'json'));
}
