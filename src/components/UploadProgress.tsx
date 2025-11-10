"use client";

import { Column, Text, Row } from "@once-ui-system/core";
import { FiCheck, FiUpload, FiAlertCircle } from "react-icons/fi";
import { useEffect, useState, memo } from "react";
import { createPortal } from "react-dom";

export interface UploadItem {
  filename: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress?: number;
}

interface UploadProgressProps {
  items: UploadItem[];
  onClose?: () => void;
  fadeOut?: boolean;
}

export const UploadProgress = memo(function UploadProgress({ items, onClose }: UploadProgressProps) {
  const [mounted, setMounted] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    // Check if all uploads are complete
    const total = items.length;
    const completed = items.filter(i => i.status === 'success').length;
    const failed = items.filter(i => i.status === 'error').length;
    const allDone = completed + failed === total && total > 0;

    if (allDone) {
      // Start fade out animation after 2 seconds
      const timer = setTimeout(() => {
        setFadeOut(true);
        // Call onClose after animation completes
        setTimeout(() => {
          onClose?.();
        }, 300);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [items, onClose]);

  if (!mounted) return null;

  return createPortal(
    <UploadProgressContent items={items} onClose={onClose} fadeOut={fadeOut} />,
    document.body
  );
});

const UploadProgressContent = memo(function UploadProgressContent({ items, onClose, fadeOut = false }: UploadProgressProps) {
  const total = items.length;
  const completed = items.filter(i => i.status === 'success').length;
  const failed = items.filter(i => i.status === 'error').length;
  const uploading = items.filter(i => i.status === 'uploading').length;

  const overallProgress = total > 0 ? (completed / total) * 100 : 0;
  const allDone = completed + failed === total;

  return (
    <Column
      gap="16"
      padding="20"
      radius="l"
      background="page"
      border="neutral-alpha-weak"
      shadow="l"
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        width: '360px',
        maxWidth: 'calc(100vw - 48px)',
        zIndex: 1000,
        animation: fadeOut ? 'slideDown 0.3s ease-out forwards' : 'slideUp 0.3s ease-out',
      }}
    >
      {/* Header */}
      <Row horizontal="between" vertical="center">
        <Column gap="4">
          <Text variant="heading-strong-s">
            {allDone ? 'Upload Complete' : 'Uploading Files'}
          </Text>
          <Text variant="label-default-xs" onBackground="neutral-weak">
            {completed} of {total} completed {failed > 0 && `• ${failed} failed`}
          </Text>
        </Column>
        {allDone && onClose && (
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: '18px',
              color: 'var(--neutral-on-background-weak)',
              padding: '4px',
            }}
          >
            ✕
          </button>
        )}
      </Row>

      {/* Overall Progress Bar */}
      <Column gap="8">
        <div
          style={{
            width: '100%',
            height: '6px',
            backgroundColor: 'var(--neutral-alpha-weak)',
            borderRadius: '999px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${overallProgress}%`,
              height: '100%',
              backgroundColor: failed > 0 && allDone 
                ? 'var(--danger-background-strong)' 
                : 'var(--accent-background-strong)',
              transition: 'width 0.3s ease-out',
            }}
          />
        </div>
        <Text variant="label-default-xs" onBackground="neutral-weak" style={{ textAlign: 'right' }}>
          {Math.round(overallProgress)}%
        </Text>
      </Column>

      {/* Individual Files */}
      <Column 
        gap="8" 
        style={{ 
          maxHeight: '240px', 
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        {items.map((item, index) => (
          <Row
            key={index}
            gap="12"
            padding="12"
            radius="m"
            background="neutral-alpha-weak"
            vertical="center"
          >
            {/* Status Icon */}
            <div style={{ flexShrink: 0 }}>
              {item.status === 'success' && (
                <div
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--accent-background-strong)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <FiCheck size={12} style={{ color: 'var(--accent-on-background-strong)' }} />
                </div>
              )}
              {item.status === 'error' && (
                <div
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--danger-background-strong)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <FiAlertCircle size={12} style={{ color: 'var(--danger-on-background-strong)' }} />
                </div>
              )}
              {item.status === 'uploading' && (
                <div
                  className="spinner"
                  style={{
                    width: '20px',
                    height: '20px',
                    border: '2px solid var(--neutral-alpha-weak)',
                    borderTopColor: 'var(--accent-background-strong)',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                  }}
                />
              )}
              {item.status === 'pending' && (
                <FiUpload size={20} style={{ color: 'var(--neutral-on-background-weak)' }} />
              )}
            </div>

            {/* Filename */}
            <Column gap="4" style={{ flex: 1, minWidth: 0 }}>
              <Text
                variant="body-default-xs"
                style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontWeight: 500,
                }}
              >
                {item.filename}
              </Text>
              {item.status === 'uploading' && item.progress !== undefined && (
                <div
                  style={{
                    width: '100%',
                    height: '3px',
                    backgroundColor: 'var(--neutral-alpha-weak)',
                    borderRadius: '999px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${item.progress}%`,
                      height: '100%',
                      backgroundColor: 'var(--accent-background-strong)',
                      transition: 'width 0.2s ease-out',
                    }}
                  />
                </div>
              )}
            </Column>
          </Row>
        ))}
      </Column>

      <style jsx>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        @keyframes slideDown {
          from {
            transform: translateY(0);
            opacity: 1;
          }
          to {
            transform: translateY(100%);
            opacity: 0;
          }
        }
      `}</style>
    </Column>
  );
});
