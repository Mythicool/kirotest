import { WorkspaceType, ToolCategory, FileSource } from '../types';

describe('Type definitions', () => {
  test('WorkspaceType enum should have correct values', () => {
    expect(WorkspaceType.CREATIVE_STUDIO).toBe('creative-studio');
    expect(WorkspaceType.DEVELOPER_HUB).toBe('developer-hub');
    expect(WorkspaceType.DOCUMENT_PIPELINE).toBe('document-pipeline');
    expect(WorkspaceType.MEDIA_SUITE).toBe('media-suite');
    expect(WorkspaceType.PRIVACY_HUB).toBe('privacy-hub');
    expect(WorkspaceType.EDUCATION_PLATFORM).toBe('education-platform');
    expect(WorkspaceType.BUSINESS_SUITE).toBe('business-suite');
    expect(WorkspaceType.GAMING_HUB).toBe('gaming-hub');
  });

  test('ToolCategory enum should have correct values', () => {
    expect(ToolCategory.IMAGE_EDITOR).toBe('image-editor');
    expect(ToolCategory.CODE_EDITOR).toBe('code-editor');
    expect(ToolCategory.DOCUMENT_EDITOR).toBe('document-editor');
    expect(ToolCategory.AUDIO_EDITOR).toBe('audio-editor');
    expect(ToolCategory.VIDEO_EDITOR).toBe('video-editor');
  });

  test('FileSource enum should have correct values', () => {
    expect(FileSource.UPLOAD).toBe('upload');
    expect(FileSource.URL_IMPORT).toBe('url_import');
    expect(FileSource.TOOL_EXPORT).toBe('tool_export');
    expect(FileSource.GENERATED).toBe('generated');
    expect(FileSource.TEMPLATE).toBe('template');
    expect(FileSource.COLLABORATION).toBe('collaboration');
  });
});