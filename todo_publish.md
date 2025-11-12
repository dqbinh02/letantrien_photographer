# Publish System TODO

## Database & Types
- [x] Add `isPublished` to album and media collections; backfill defaults for existing documents
- [x] Update TypeScript definitions in `src/types/album.types.ts` and `src/types/index.ts`
- [x] Update MongoDB helper logic in `src/lib/mongodb.ts` if any schema assumptions change

## API Layer
- [x] Implement `GET /api/albums` to return published albums only
- [x] Implement `GET /api/albums/[albumId]` with token-aware access rules
- [x] Implement `GET /api/admin/albums` for full admin listing
- [x] Implement `GET /api/admin/albums/[albumId]` for admin detail view
- [x] Implement `PUT /api/admin/albums/[albumId]` for metadata and publish status updates
- [x] Implement `DELETE /api/admin/albums/[albumId]`
- [x] Implement `PUT /api/admin/media/[mediaId]` to toggle publish status
- [x] Wire API endpoints into frontend fetch utilities

## Admin UI (`/admin/albums/[albumId]`)
- [ ] Add debounced title/description editors with auto-save UX
- [ ] Add album publish/private toggle with optimistic UI and rollback handling
- [ ] Ensure upload section remains functional after state refactor
- [x] Update media management cards with publish/unpublish button and iconography
- [ ] Surface publish status in album list cards in admin dashboard

## Public UI
- [x] Replace `/gallery/[token]` usage with unified `/albums/[albumId]` route
- [x] Build public albums listing page `/albums` with responsive grid
- [x] Update album detail page to filter media based on publish rules
- [x] Add shareable link generator respecting token query param
- [x] Review `AlbumCard`, `MediaGrid`, and `GalleryView` for publish-aware rendering

## Routing & Navigation
- [x] Update Next.js routing tree to remove obsolete `src/app/gallery/[token]`
- [x] Ensure dynamic route params support optional `token` query
- [ ] Audit navigation links (header/footer) to point to new routes

## Testing & QA
- [ ] Add unit tests for publish-state filtering logic
- [ ] Add integration tests for API endpoints
- [ ] Add E2E flows covering admin publish toggles and public visibility
- [ ] Smoke-test deploy preview with seed data

## Deployment & Ops
- [ ] Prepare migration script or manual runbook for schema flag defaults
- [ ] Update documentation in `docs/Album Management & Publish.md` post-implementation
- [ ] Coordinate deploy window and rollback plan
 