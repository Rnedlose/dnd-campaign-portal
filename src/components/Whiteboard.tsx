'use client';

import "tldraw/tldraw.css";
import { Tldraw, DefaultStylePanel, TLRecord, Editor, TLAssetStore, TLAsset } from "tldraw";
import { useRoom } from "@/lib/liveblocks";
import { Avatars } from "@/components/Avatars";
import { Badge } from "@/components/Badge";
import { useEffect, useRef, useState } from "react";
import * as Y from "yjs";
import { LiveblocksYjsProvider } from "@liveblocks/yjs";
import { uploadFiles } from "@/lib/uploadthing-client";
import { TldrawFilePicker } from "./TldrawFilePicker";
import { createPortal } from "react-dom";
import { nanoid } from 'nanoid';

// Debounce helper with a longer delay for better performance
function debounce<T extends (...args: unknown[]) => void>(fn: T, delay: number) {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}

export default function Whiteboard({ campaignId, setOpenFilePicker }: { campaignId: string, setOpenFilePicker?: (fn: () => void) => void }) {
  const room = useRoom();
  const docRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<LiveblocksYjsProvider | null>(null);
  const editorRef = useRef<Editor | null>(null);
  const isUpdatingRef = useRef(false);
  const [isFilePickerOpen, setIsFilePickerOpen] = useState(false);

  // Add debug logging
  useEffect(() => {
    console.log('File picker state changed:', isFilePickerOpen);
  }, [isFilePickerOpen]);

  useEffect(() => {
    if (setOpenFilePicker) {
      setOpenFilePicker(() => () => setIsFilePickerOpen(true));
    }
  }, [setOpenFilePicker]);

  // Initialize Yjs document and provider
  useEffect(() => {
    docRef.current = new Y.Doc();
    providerRef.current = new LiveblocksYjsProvider(room, docRef.current);
    return () => {
      providerRef.current?.destroy();
      docRef.current?.destroy();
    };
  }, [room]);

  // Asset store for tldraw to handle collaborative image uploads via UploadThing
  const assetStore: TLAssetStore = {
    async upload(asset, file) {
      if (asset.type === "image") {
        const files = [file];
        const uploaded = await uploadFiles("imageUploader", { files });
        if (uploaded && uploaded[0]?.url) {
          // Save file metadata to campaign files DB
          try {
            const res = await fetch('/api/files', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                campaignId,
                name: file.name,
                url: uploaded[0].url,
                type: file.type,
                size: file.size,
                gmOnly: false,
              }),
            });
            if (res.status === 409) {
              // Delete the uploaded file from UploadThing
              await fetch('/api/uploadthing/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: uploaded[0].url }),
              });
              alert('A file with this name already exists in this campaign.');
              return { src: '' };
            }
          } catch (err) {
            console.error('Failed to save tldraw-uploaded image to campaign files:', err);
          }
          return { src: uploaded[0].url };
        }
      }
      // fallback: return the original src if upload fails
      return { src: (asset as TLAsset).props?.src || "" };
    },
    resolve(asset) {
      // Always return the src for the asset
      return (asset as TLAsset).props?.src || "";
    },
  };

  const handleFileSelect = async (file: { url: string; name: string; size: number; type: string }) => {
    if (!editorRef.current) {
      return;
    }

    // Get the current camera position
    const camera = editorRef.current.getCamera();

    // Calculate proper image dimensions with CORS-safe approach
    const getImageDimensions = (url: string): Promise<{ width: number; height: number }> => {
      return new Promise((resolve) => {
        const img = new window.Image();
        img.crossOrigin = 'anonymous'; // Handle CORS
        
        // Add a timeout to prevent hanging
        const timeout = setTimeout(() => {
          console.warn('Image dimension calculation timed out, using default size');
          resolve({ width: 800, height: 600 });
        }, 5000); // 5 second timeout
        
        img.onload = () => {
          clearTimeout(timeout);
          resolve({ width: img.naturalWidth, height: img.naturalHeight });
        };
        
        img.onerror = () => {
          clearTimeout(timeout);
          console.warn('Failed to load image for dimension calculation, using default size');
          resolve({ width: 800, height: 600 });
        };
        
        img.src = url;
      });
    };

    // Get the actual image dimensions with error handling
    let originalWidth = 800;
    let originalHeight = 600;
    
    try {
      const dimensions = await getImageDimensions(file.url);
      originalWidth = dimensions.width;
      originalHeight = dimensions.height;
    } catch (error) {
      console.warn('Error getting image dimensions:', error);
      // Use default dimensions if there's an error
    }

    // Calculate display dimensions while maintaining aspect ratio
    // Set a maximum display size to prevent extremely large images
    const maxDisplaySize = 1200;
    let displayWidth = originalWidth;
    let displayHeight = originalHeight;

    // Scale down if the image is larger than maxDisplaySize in either dimension
    if (originalWidth > maxDisplaySize || originalHeight > maxDisplaySize) {
      const scale = Math.min(maxDisplaySize / originalWidth, maxDisplaySize / originalHeight);
      displayWidth = Math.round(originalWidth * scale);
      displayHeight = Math.round(originalHeight * scale);
    }

    // Create the image asset
    const assetId = `asset:${nanoid()}`;
    const asset = {
      id: assetId,
      type: 'image' as const,
      typeName: 'asset' as const,
      props: {
        src: file.url,
        w: displayWidth,
        h: displayHeight,
        name: file.name,
        mimeType: file.type,
        isAnimated: false,
        fileSize: file.size,
      },
      meta: {},
    } as TLAsset;
    editorRef.current.createAssets([asset]);

    // Immediately push the new asset to Yjs/Liveblocks
    if (docRef.current) {
      const ymap = docRef.current.getMap("tldraw");
      const snapshot = editorRef.current.store.getSnapshot();
      ymap.set("store", snapshot.store);
    }

    // Wait for asset registration
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Create the image shape at the camera position
    const shape = {
      type: 'image',
      x: camera.x,
      y: camera.y,
      props: {
        assetId,
        w: displayWidth,
        h: displayHeight,
      },
    };
    editorRef.current.createShape(shape);
  };

  return (
    <>
      <div className="w-full h-full relative">
        <Tldraw
          persistenceKey="whiteboard"
          assets={assetStore}
          onMount={(editor: Editor) => {
            editorRef.current = editor;
            const doc = docRef.current!;
            const ymap = doc.getMap("tldraw");

            // Load initial state only once
            const initialStore = ymap.get("store") || {};
            editor.store.loadSnapshot({
              store: initialStore as Record<string, TLRecord>,
              schema: editor.store.schema.serialize(),
            });

            // Debounced Yjs update with increased delay for better performance
            const debouncedYjsUpdate = debounce(() => {
              if (isUpdatingRef.current) return;
              try {
                const snapshot = editor.store.getSnapshot();
                ymap.set("store", snapshot.store);
              } catch (error) {
                console.error('Error updating Yjs store:', error);
              }
            }, 100);

            // Listen for local changes and update Yjs
            const unsub = editor.store.listen(() => {
              debouncedYjsUpdate();
            });

            // Listen for remote changes and update Tldraw
            const observer = () => {
              if (isUpdatingRef.current) return;
              
              try {
                isUpdatingRef.current = true;
                const snapshot = editor.store.getSnapshot();
                const remoteStore = ymap.get("store");
                
                if (remoteStore && JSON.stringify(remoteStore) !== JSON.stringify(snapshot.store)) {
                  // Preserve the current camera state
                  const currentCamera = editor.getCamera();
                  
                  // Update the store with the new state
                  editor.store.loadSnapshot({
                    store: remoteStore as Record<string, TLRecord>,
                    schema: snapshot.schema,
                  });

                  // Restore the camera state
                  editor.setCamera(currentCamera);
                }
              } catch (error) {
                console.error('Error updating whiteboard state:', error);
              } finally {
                isUpdatingRef.current = false;
              }
            };

            ymap.observe(observer);

            // Cleanup listeners on unmount
            return () => {
              unsub();
              ymap.unobserve(observer);
            };
          }}
          components={{
            StylePanel: () => (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
                <Avatars />
                <DefaultStylePanel />
                <Badge />
              </div>
            ),
          }}
          autoFocus
        />
      </div>
      {typeof window !== 'undefined' && createPortal(
        <TldrawFilePicker
          campaignId={campaignId}
          isOpen={isFilePickerOpen}
          onClose={() => setIsFilePickerOpen(false)}
          onSelect={handleFileSelect}
        />,
        document.body
      )}
    </>
  );
}