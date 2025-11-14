"use client"

import { useState, useEffect } from 'react'
import { useInlineEditor } from '@/contexts/inline-editor-context'
import { Upload, X, Link, Check } from 'lucide-react'

interface EditableMediaProps {
  src: string
  onChange: (src: string) => void
  type?: 'image' | 'video' | 'auto'
  className?: string
  storageKey?: string
  alt?: string
  purpose?: string // 파일 용도 (hero-profile, hero-background 등)
}

export function EditableMedia({ 
  src, 
  onChange, 
  type = 'auto',
  className = '',
  storageKey,
  alt = 'Media',
  purpose = 'general'
}: EditableMediaProps) {
  const { isEditMode, saveData, getData } = useInlineEditor()
  const [isHovered, setIsHovered] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadType, setUploadType] = useState<'file' | 'url'>('file')
  const [urlInput, setUrlInput] = useState('')
  const [previewUrl, setPreviewUrl] = useState(src)

  // 초기값 로드
  useEffect(() => {
    if (storageKey) {
      const saved = getData(storageKey) as string | null
      if (saved) {
        onChange(saved)
        setPreviewUrl(saved)
      }
    }
  }, [storageKey])

  const isVideo = type === 'video' || (type === 'auto' && (src?.includes('.mp4') || src?.includes('.webm') || src?.includes('youtube')))

  // 파일 업로드 함수 제거 (public 폴더 방식 사용)

  const handleUrlSubmit = () => {
    if (urlInput) {
      setPreviewUrl(urlInput)
      onChange(urlInput)
      if (storageKey) {
        saveData(storageKey, urlInput)
      }
      setShowUploadModal(false)
      setUrlInput('')
    }
  }

  const handleRemove = async () => {
    // uploads 폴더의 이미지인 경우 서버에서도 삭제
    if (previewUrl && previewUrl.startsWith('/uploads/')) {
      try {
        const response = await fetch('/api/delete-image', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ imagePath: previewUrl })
        })
        
        const result = await response.json()
        if (result.success) {
          console.log('이미지 삭제 완료')
        }
      } catch (error) {
        console.error('이미지 삭제 실패:', error)
      }
    }
    
    onChange('')
    setPreviewUrl('')
    if (storageKey) {
      saveData(storageKey, '')
    }
  }

  if (!isEditMode) {
    // src가 빈 문자열이면 아무것도 렌더링하지 않음
    if (!src) {
      return null
    }
    
    if (isVideo) {
      return (
        <video 
          src={src} 
          className={className}
          autoPlay 
          loop 
          muted 
          playsInline
        />
      )
    }
    return <img 
      src={src} 
      alt={alt} 
      className={className}
      onError={(e) => {
        // 이미지 로드 실패 시 숨김 처리
        const target = e.target as HTMLImageElement
        target.style.opacity = '0'
        // localStorage에서 제거 고려
        if (storageKey && src.includes('/uploads/')) {
          console.warn(`Image not found: ${src}`)
        }
      }}
    />
  }

  return (
    <>
      <div 
        className="relative group w-full h-full"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {previewUrl ? (
          <>
            {isVideo ? (
              <video 
                src={previewUrl} 
                className={className}
                autoPlay 
                loop 
                muted 
                playsInline
              />
            ) : (
              <img src={previewUrl} alt={alt} className={className} />
            )}
            {isHovered && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center gap-2">
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="p-2 bg-white/90 rounded-lg hover:bg-white transition-colors"
                >
                  <Upload className="h-5 w-5 text-black" />
                </button>
                <button
                  onClick={handleRemove}
                  className="p-2 bg-red-500/90 rounded-lg hover:bg-red-500 transition-colors"
                >
                  <X className="h-5 w-5 text-white" />
                </button>
              </div>
            )}
          </>
        ) : (
          <div 
            onClick={() => setShowUploadModal(true)}
            className={`${className} border-2 border-dashed border-muted-foreground/30 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-muted-foreground/50 transition-colors min-h-[200px]`}
          >
            <Upload className="h-8 w-8 text-muted-foreground mb-2" />
            <span className="text-sm text-muted-foreground">클릭하여 업로드</span>
          </div>
        )}
      </div>

      {/* 업로드 모달 */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background border rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">미디어 업로드</h3>
            
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setUploadType('file')}
                className={`flex-1 py-2 px-4 rounded-lg border ${uploadType === 'file' ? 'bg-primary text-primary-foreground' : 'bg-background'}`}
              >
                <Upload className="h-4 w-4 inline mr-2" />
                파일 업로드
              </button>
              <button
                onClick={() => setUploadType('url')}
                className={`flex-1 py-2 px-4 rounded-lg border ${uploadType === 'url' ? 'bg-primary text-primary-foreground' : 'bg-background'}`}
              >
                <Link className="h-4 w-4 inline mr-2" />
                URL 입력
              </button>
            </div>

            {uploadType === 'file' ? (
              <div>
                <div className="mb-4 p-4 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-2">📁 컴퓨터에서 이미지 선택:</p>
                  <p className="text-xs text-muted-foreground mb-2">
                    JPG, PNG, GIF, WebP 지원 (최대 5MB)
                  </p>
                  {previewUrl && (
                    <p className="text-xs text-amber-600 dark:text-amber-500">
                      ⚠️ 새 이미지 업로드시 기존 이미지가 교체됩니다 (서버에서 자동 삭제)
                    </p>
                  )}
                </div>
                <input
                  id="file-upload"
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    
                    // 파일 크기 체크
                    if (file.size > 5 * 1024 * 1024) {
                      alert('파일 크기는 5MB 이하여야 합니다')
                      return
                    }
                    
                    // 파일 업로드
                    const formData = new FormData()
                    formData.append('file', file)
                    formData.append('purpose', purpose)
                    formData.append('oldPath', previewUrl || '')
                    
                    try {
                      const response = await fetch('/api/upload-image', {
                        method: 'POST',
                        body: formData
                      })
                      
                      const result = await response.json()
                      
                      if (result.success) {
                        setPreviewUrl(result.path)
                        onChange(result.path)
                        if (storageKey) {
                          saveData(storageKey, result.path)
                        }
                        setShowUploadModal(false)
                        alert('✅ 이미지가 업로드되었습니다!')
                      } else {
                        alert(`❌ ${result.error}`)
                      }
                    } catch {
                      alert('업로드 중 오류가 발생했습니다')
                    }
                  }}
                  className="hidden"
                />
                <label
                  htmlFor="file-upload"
                  className="w-full py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 cursor-pointer flex items-center justify-center"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  파일 선택
                </label>
              </div>
            ) : (
              <div>
                <input
                  type="text"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-3 py-2 border rounded-lg bg-background"
                  onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
                />
                <button
                  onClick={handleUrlSubmit}
                  className="w-full mt-2 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                >
                  <Check className="h-4 w-4 inline mr-2" />
                  적용
                </button>
              </div>
            )}

            <button
              onClick={() => setShowUploadModal(false)}
              className="w-full mt-4 py-2 border rounded-lg hover:bg-muted"
            >
              취소
            </button>
          </div>
        </div>
      )}
    </>
  )
}