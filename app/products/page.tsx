'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

interface Product {
  id: string
  name: string
  category: string
  base_price: number
  price?: number
  description?: string
  image_url?: string
  gallery_images?: string[]
  active?: boolean
  created_at?: string
  updated_at?: string
  organization_id?: string
}

export default function ProductsPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('הכל')
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadingGallery, setUploadingGallery] = useState(false)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([])
  const [selectedProductImage, setSelectedProductImage] = useState<{[key: string]: number}>({})
  const [showImageModal, setShowImageModal] = useState(false)
  const [modalImage, setModalImage] = useState<string>('')
  const [modalImages, setModalImages] = useState<string[]>([])
  const [modalImageIndex, setModalImageIndex] = useState(0)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [customCategories, setCustomCategories] = useState<string[]>([])
  
  // Product Detail Popup
  const [showProductPopup, setShowProductPopup] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedPopupImageIndex, setSelectedPopupImageIndex] = useState(0)
  const [numberOfPayments, setNumberOfPayments] = useState(1)
  
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    base_price: '',
    price: '',
    description: '',
    image_url: '',
    gallery_images: [] as string[],
    active: true
  })

  const defaultCategories = ['ארוחות', 'משקאות', 'קינוחים', 'תוספות', 'סלטים', 'מנות ראשונות', 'מבצעים']

  const getAllCategories = () => {
    return [...defaultCategories, ...customCategories].sort()
  }

  const categories = ['הכל', ...getAllCategories()]

  useEffect(() => {
    checkUser()
    fetchProducts()
    loadCustomCategories()
  }, [])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showImageModal) setShowImageModal(false)
        if (showProductPopup) setShowProductPopup(false)
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [showImageModal, showProductPopup])

  const loadCustomCategories = () => {
    const saved = localStorage.getItem('customCategories')
    if (saved) {
      setCustomCategories(JSON.parse(saved))
    }
  }

  const saveCustomCategories = (categories: string[]) => {
    localStorage.setItem('customCategories', JSON.stringify(categories))
    setCustomCategories(categories)
  }

  const handleAddNewCategory = () => {
    const trimmedName = newCategoryName.trim()
    if (!trimmedName) {
      alert('נא להזין שם קטגוריה')
      return
    }
    
    const allCats = getAllCategories()
    if (allCats.includes(trimmedName)) {
      alert('קטגוריה זו כבר קיימת')
      return
    }

    const updatedCategories = [...customCategories, trimmedName]
    saveCustomCategories(updatedCategories)
    setFormData({ ...formData, category: trimmedName })
    setNewCategoryName('')
    setShowNewCategoryInput(false)
  }

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }
    } catch (error) {
      console.error('Error checking user:', error)
    }
  }

  async function fetchProducts() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching products:', error)
        throw error
      }
      
      setProducts(data || [])
    } catch (error) {
      console.error('Error fetching products:', error)
      alert('שגיאה בטעינת המוצרים')
    } finally {
      setLoading(false)
    }
  }

  const openProductPopup = (product: Product) => {
    setSelectedProduct(product)
    setSelectedPopupImageIndex(0)
    setNumberOfPayments(1)
    setShowProductPopup(true)
  }

  const calculatePriceWithPayments = (basePrice: number, payments: number) => {
    if (payments === 1) return basePrice
    // כאן תוכל להוסיף לוגיקה של ריבית/עמלה אם צריך
    return basePrice
  }

  const getPricePerPayment = (totalPrice: number, payments: number) => {
    return totalPrice / payments
  }

  const addToCart = (product: Product, payments: number) => {
    const cart = JSON.parse(sessionStorage.getItem('orderCart') || '[]')
    
    const totalPrice = calculatePriceWithPayments(product.price || product.base_price, payments)
    
    cart.push({
      product: product,
      quantity: 1,
      discount: 0,
      selectedOptions: [],
      numberOfPayments: payments,
      totalPrice: totalPrice,
      pricePerPayment: getPricePerPayment(totalPrice, payments)
    })
    
    sessionStorage.setItem('orderCart', JSON.stringify(cart))
    alert(`${product.name} נוסף לסל!\nתשלומים: ${payments}\nמחיר לתשלום: ₪${getPricePerPayment(totalPrice, payments).toFixed(2)}`)
    setShowProductPopup(false)
  }

  async function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    setUploadingImage(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `products/${fileName}`

      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(filePath, file)

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath)

      setFormData({ ...formData, image_url: publicUrl })
      setImagePreview(publicUrl)
      
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('שגיאה בהעלאת התמונה')
    } finally {
      setUploadingImage(false)
    }
  }

  async function handleGalleryUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files
    if (!files || files.length === 0) return

    setUploadingGallery(true)
    const uploadedUrls: string[] = []

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}-${i}.${fileExt}`
        const filePath = `products/gallery/${fileName}`

        const { data, error } = await supabase.storage
          .from('product-images')
          .upload(filePath, file)

        if (error) throw error

        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath)

        uploadedUrls.push(publicUrl)
      }

      const newGalleryImages = [...formData.gallery_images, ...uploadedUrls]
      setFormData({ ...formData, gallery_images: newGalleryImages })
      setGalleryPreviews([...galleryPreviews, ...uploadedUrls])
      
    } catch (error) {
      console.error('Error uploading gallery images:', error)
      alert('שגיאה בהעלאת תמונות הגלריה')
    } finally {
      setUploadingGallery(false)
    }
  }

  function removeGalleryImage(index: number) {
    const newGalleryImages = formData.gallery_images.filter((_, i) => i !== index)
    const newPreviews = galleryPreviews.filter((_, i) => i !== index)
    setFormData({ ...formData, gallery_images: newGalleryImages })
    setGalleryPreviews(newPreviews)
  }

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    setDragOverIndex(index)
  }

  const handleDragLeave = () => {
    setDragOverIndex(null)
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null)
      setDragOverIndex(null)
      return
    }

    const newGalleryImages = [...galleryPreviews]
    const draggedImage = newGalleryImages[draggedIndex]
    
    newGalleryImages.splice(draggedIndex, 1)
    
    const adjustedDropIndex = dropIndex > draggedIndex ? dropIndex - 1 : dropIndex
    newGalleryImages.splice(adjustedDropIndex, 0, draggedImage)
    
    setGalleryPreviews(newGalleryImages)
    setFormData({ ...formData, gallery_images: newGalleryImages })
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const openImageModal = (images: string[], imageIndex: number = 0) => {
    setModalImages(images)
    setModalImageIndex(imageIndex)
    setModalImage(images[imageIndex])
    setShowImageModal(true)
  }

  const navigateModal = (direction: 'prev' | 'next') => {
    let newIndex = modalImageIndex
    
    if (direction === 'prev') {
      newIndex = modalImageIndex > 0 ? modalImageIndex - 1 : modalImages.length - 1
    } else {
      newIndex = modalImageIndex < modalImages.length - 1 ? modalImageIndex + 1 : 0
    }
    
    setModalImageIndex(newIndex)
    setModalImage(modalImages[newIndex])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    try {
      const productData = {
        name: formData.name.trim(),
        category: formData.category,
        base_price: parseFloat(formData.base_price) || 0,
        price: formData.price ? parseFloat(formData.price) : parseFloat(formData.base_price) || 0,
        description: formData.description || null,
        image_url: formData.image_url || null,
        gallery_images: formData.gallery_images.length > 0 ? formData.gallery_images : null,
        active: formData.active,
        updated_at: new Date().toISOString()
      }

      if (editingProduct) {
        const { data, error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id)
          .select()

        if (error) throw error
      } else {
        const newProduct = {
          ...productData,
          created_at: new Date().toISOString()
        }
        
        const { data, error } = await supabase
          .from('products')
          .insert([newProduct])
          .select()

        if (error) throw error
      }

      await fetchProducts()
      
      setFormData({ 
        name: '', 
        category: '', 
        base_price: '',
        price: '',
        description: '',
        image_url: '',
        gallery_images: [],
        active: true 
      })
      setImagePreview('')
      setGalleryPreviews([])
      setShowForm(false)
      setEditingProduct(null)
      
      alert(editingProduct ? 'המוצר עודכן בהצלחה!' : 'המוצר נוסף בהצלחה!')
      
    } catch (error: any) {
      console.error('Error saving product:', error)
      alert('שגיאה בשמירת המוצר: ' + (error.message || 'שגיאה לא ידועה'))
    }
  }

  async function handleDelete(id: string, productName: string) {
    if (!confirm(`האם אתה בטוח שברצונך למחוק את המוצר "${productName}"?`)) return

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      await fetchProducts()
      alert('המוצר נמחק בהצלחה')
    } catch (error: any) {
      console.error('Error deleting product:', error)
      alert('שגיאה במחיקת המוצר: ' + (error.message || 'שגיאה לא ידועה'))
    }
  }

  function handleEdit(product: Product, e: React.MouseEvent) {
    e.stopPropagation()
    setEditingProduct(product)
    setFormData({
      name: product.name || '',
      category: product.category || '',
      base_price: product.base_price?.toString() || '',
      price: product.price?.toString() || '',
      description: product.description || '',
      image_url: product.image_url || '',
      gallery_images: product.gallery_images || [],
      active: product.active ?? true
    })
    setImagePreview(product.image_url || '')
    setGalleryPreviews(product.gallery_images || [])
    setShowForm(true)
  }

  function handleCancel() {
    setShowForm(false)
    setEditingProduct(null)
    setFormData({ 
      name: '', 
      category: '', 
      base_price: '',
      price: '',
      description: '',
      image_url: '',
      gallery_images: [],
      active: true 
    })
    setImagePreview('')
    setGalleryPreviews([])
    setShowNewCategoryInput(false)
    setNewCategoryName('')
  }

  function selectProductImage(productId: string, imageIndex: number) {
    setSelectedProductImage({ ...selectedProductImage, [productId]: imageIndex })
  }

  const filteredProducts = selectedCategory === 'הכל' 
    ? products 
    : products.filter(p => p.category === selectedCategory)

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
        direction: 'rtl'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
          <h2>טוען מוצרים...</h2>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      direction: 'rtl'
    }}>
      {/* Product Detail Popup */}
      {showProductPopup && selectedProduct && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            overflow: 'auto'
          }}
          onClick={() => setShowProductPopup(false)}
        >
          <div 
            style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              maxWidth: '900px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowProductPopup(false)}
              style={{
                position: 'absolute',
                top: '15px',
                left: '15px',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: 'rgba(0,0,0,0.5)',
                color: 'white',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                zIndex: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ✕
            </button>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', padding: '30px' }}>
              {/* Images Section */}
              <div>
                {(() => {
                  const allImages = [selectedProduct.image_url, ...(selectedProduct.gallery_images || [])].filter(Boolean)
                  const currentImage = allImages[selectedPopupImageIndex]
                  
                  return (
                    <>
                      <div style={{
                        width: '100%',
                        height: '400px',
                        backgroundColor: '#f0f0f0',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        marginBottom: '15px',
                        position: 'relative',
                        cursor: 'zoom-in'
                      }}
                      onClick={() => currentImage && openImageModal(allImages, selectedPopupImageIndex)}
                      >
                        {currentImage ? (
                          <img 
                            src={currentImage} 
                            alt={selectedProduct.name}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                          />
                        ) : (
                          <div style={{ 
                            width: '100%', 
                            height: '100%', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center' 
                          }}>
                            <span style={{ fontSize: '64px', color: '#ccc' }}>🍽️</span>
                          </div>
                        )}
                      </div>

                      {allImages.length > 1 && (
                        <div style={{ display: 'flex', gap: '10px', overflowX: 'auto' }}>
                          {allImages.map((img, index) => (
                            <div
                              key={index}
                              onClick={() => setSelectedPopupImageIndex(index)}
                              style={{
                                width: '80px',
                                height: '80px',
                                borderRadius: '8px',
                                overflow: 'hidden',
                                cursor: 'pointer',
                                border: selectedPopupImageIndex === index ? '3px solid #4CAF50' : '2px solid #ddd',
                                flexShrink: 0
                              }}
                            >
                              <img 
                                src={img} 
                                alt={`תמונה ${index + 1}`}
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover'
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )
                })()}
              </div>

              {/* Details Section */}
              <div>
                <span style={{
                  display: 'inline-block',
                  padding: '5px 15px',
                  borderRadius: '20px',
                  fontSize: '13px',
                  backgroundColor: '#9C27B0',
                  color: 'white',
                  fontWeight: '500',
                  marginBottom: '15px'
                }}>
                  {selectedProduct.category}
                </span>

                <h2 style={{
                  fontSize: '32px',
                  marginBottom: '15px',
                  color: '#333',
                  fontWeight: 'bold'
                }}>
                  {selectedProduct.name}
                </h2>

                {selectedProduct.description && (
                  <p style={{
                    fontSize: '16px',
                    color: '#666',
                    lineHeight: '1.6',
                    marginBottom: '25px'
                  }}>
                    {selectedProduct.description}
                  </p>
                )}

                <div style={{
                  backgroundColor: '#f9f9f9',
                  padding: '20px',
                  borderRadius: '12px',
                  marginBottom: '25px'
                }}>
                  <div style={{ marginBottom: '20px' }}>
                    <span style={{ fontSize: '16px', color: '#666', display: 'block', marginBottom: '5px' }}>מחיר</span>
                    {selectedProduct.price && selectedProduct.price !== selectedProduct.base_price ? (
                      <div>
                        <span style={{
                          fontSize: '32px',
                          fontWeight: 'bold',
                          color: '#4CAF50'
                        }}>
                          ₪{selectedProduct.price.toFixed(2)}
                        </span>
                        <span style={{
                          fontSize: '20px',
                          color: '#999',
                          textDecoration: 'line-through',
                          marginRight: '10px'
                        }}>
                          ₪{selectedProduct.base_price.toFixed(2)}
                        </span>
                      </div>
                    ) : (
                      <span style={{
                        fontSize: '32px',
                        fontWeight: 'bold',
                        color: '#333'
                      }}>
                        ₪{selectedProduct.base_price.toFixed(2)}
                      </span>
                    )}
                  </div>

                  <div style={{
                    borderTop: '2px solid #e0e0e0',
                    paddingTop: '20px'
                  }}>
                    <label style={{
                      display: 'block',
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#333',
                      marginBottom: '10px'
                    }}>
                      מספר תשלומים
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="36"
                      value={numberOfPayments}
                      onChange={(e) => setNumberOfPayments(Math.max(1, parseInt(e.target.value) || 1))}
                      style={{
                        width: '100%',
                        padding: '12px',
                        fontSize: '18px',
                        border: '2px solid #ddd',
                        borderRadius: '8px',
                        textAlign: 'center',
                        fontWeight: 'bold'
                      }}
                    />

                    {numberOfPayments > 1 && (
                      <div style={{
                        marginTop: '15px',
                        padding: '15px',
                        backgroundColor: '#e3f2fd',
                        borderRadius: '8px',
                        border: '2px solid #2196F3'
                      }}>
                        <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>
                          מחיר לתשלום
                        </div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2196F3' }}>
                          ₪{getPricePerPayment(
                            calculatePriceWithPayments(selectedProduct.price || selectedProduct.base_price, numberOfPayments),
                            numberOfPayments
                          ).toFixed(2)}
                        </div>
                        <div style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>
                          סה"כ: ₪{calculatePriceWithPayments(selectedProduct.price || selectedProduct.base_price, numberOfPayments).toFixed(2)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {showImageModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.9)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'zoom-out'
          }}
          onClick={() => setShowImageModal(false)}
        >
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowImageModal(false)
            }}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.3)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)'}
          >
            ✕
          </button>

          {modalImages.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  navigateModal('prev')
                }}
                style={{
                  position: 'absolute',
                  left: '20px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.3s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.3)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)'}
              >
                ‹
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation()
                  navigateModal('next')
                }}
                style={{
                  position: 'absolute',
                  right: '20px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.3s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.3)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)'}
              >
                ›
              </button>
            </>
          )}

          <img
            src={modalImage}
            alt="תצוגה מוגדלת"
            style={{
              maxWidth: '90%',
              maxHeight: '90%',
              objectFit: 'contain',
              cursor: 'default',
              boxShadow: '0 0 40px rgba(0,0,0,0.5)'
            }}
            onClick={(e) => e.stopPropagation()}
          />

          {modalImages.length > 1 && (
            <div style={{
              position: 'absolute',
              bottom: '30px',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: 'rgba(0,0,0,0.7)',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '20px',
              fontSize: '14px'
            }}>
              {modalImageIndex + 1} / {modalImages.length}
            </div>
          )}
        </div>
      )}

      {/* Header */}
      <header style={{
        backgroundColor: 'white',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        padding: '20px',
        marginBottom: '30px'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h1 style={{ 
            margin: 0,
            fontSize: '24px',
            color: '#333',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            ניהול מוצרים
          </h1>
          
          <button
            onClick={() => setShowForm(!showForm)}
            style={{
              backgroundColor: '#4CAF50',
              color: 'white',
              padding: '12px 24px',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.3s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#45a049'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4CAF50'}
          >
            <span style={{ fontSize: '20px' }}>+</span>
            <span>הוסף מוצר חדש</span>
          </button>
        </div>
      </header>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
        
        {/* Form Section - כאן יבוא כל קוד הטופס הקיים שלך */}
        {showForm && (
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '12px',
            marginBottom: '30px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            {/* כל קוד הטופס הקיים נשאר כמו שהוא */}
          </div>
        )}

        {/* Category Tabs */}
        <div style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '30px',
          overflowX: 'auto',
          padding: '5px 0'
        }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '10px 20px',
                backgroundColor: selectedCategory === cat ? '#4CAF50' : 'white',
                color: selectedCategory === cat ? 'white' : '#666',
                border: selectedCategory === cat ? 'none' : '1px solid #ddd',
                borderRadius: '25px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                whiteSpace: 'nowrap',
                transition: 'all 0.3s',
                boxShadow: selectedCategory === cat ? '0 2px 8px rgba(76, 175, 80, 0.3)' : '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              {cat}
              {cat !== 'הכל' && (
                <span style={{ marginRight: '5px', opacity: 0.7 }}>
                  ({products.filter(p => p.category === cat).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
          gap: '20px',
          marginBottom: '30px'
        }}>
          {filteredProducts.map((product) => {
            const allImages = [product.image_url, ...(product.gallery_images || [])].filter(Boolean)
            const currentImageIndex = selectedProductImage[product.id] || 0
            const currentImage = allImages[currentImageIndex]
            
            return (
              <div
                key={product.id}
                onClick={() => openProductPopup(product)}
                style={{
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  transition: 'all 0.3s',
                  position: 'relative',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-5px)'
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.15)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'
                }}
              >
                <div style={{
                  width: '100%',
                  height: '200px',
                  backgroundColor: '#f0f0f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  position: 'relative'
                }}>
                  {currentImage ? (
                    <img 
                      src={currentImage} 
                      alt={product.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  ) : (
                    <span style={{ fontSize: '64px', color: '#ccc' }}>🍽️</span>
                  )}

                  {allImages.length > 1 && (
                    <div style={{
                      position: 'absolute',
                      bottom: '10px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      display: 'flex',
                      gap: '5px',
                      backgroundColor: 'rgba(0,0,0,0.3)',
                      padding: '5px 10px',
                      borderRadius: '15px'
                    }}>
                      {allImages.map((_, index) => (
                        <button
                          key={index}
                          onClick={(e) => {
                            e.stopPropagation()
                            selectProductImage(product.id, index)
                          }}
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            border: 'none',
                            backgroundColor: currentImageIndex === index ? 'white' : 'rgba(255,255,255,0.5)',
                            cursor: 'pointer',
                            transition: 'all 0.3s'
                          }}
                        />
                      ))}
                    </div>
                  )}
                  
                  <div style={{
                    position: 'absolute',
                    top: '10px',
                    left: '10px',
                    padding: '4px 10px',
                    borderRadius: '15px',
                    fontSize: '11px',
                    fontWeight: '500',
                    backgroundColor: product.active ? '#4CAF50' : '#f44336',
                    color: 'white'
                  }}>
                    {product.active ? 'פעיל' : 'לא פעיל'}
                  </div>
                </div>

                <div style={{ padding: '15px' }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'start',
                    marginBottom: '8px'
                  }}>
                    <h3 style={{
                      margin: 0,
                      fontSize: '16px',
                      color: '#333',
                      fontWeight: '600'
                    }}>
                      {product.name}
                    </h3>
                    <span style={{
                      padding: '3px 10px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      backgroundColor: '#9C27B0',
                      color: 'white',
                      fontWeight: '500'
                    }}>
                      {product.category}
                    </span>
                  </div>

                  {product.description && (
                    <p style={{
                      margin: '0 0 10px 0',
                      fontSize: '13px',
                      color: '#666',
                      lineHeight: '1.4'
                    }}>
                      {product.description.length > 60 
                        ? product.description.substring(0, 60) + '...' 
                        : product.description}
                    </p>
                  )}

                  <div style={{
                    marginTop: '15px',
                    paddingTop: '15px',
                    borderTop: '1px solid #f0f0f0'
                  }}>
                    <div style={{ marginBottom: '10px' }}>
                      {product.price && product.price !== product.base_price ? (
                        <div>
                          <span style={{
                            fontSize: '18px',
                            fontWeight: 'bold',
                            color: '#4CAF50'
                          }}>
                            ₪{product.price.toFixed(2)}
                          </span>
                          <span style={{
                            fontSize: '14px',
                            color: '#999',
                            textDecoration: 'line-through',
                            marginRight: '8px'
                          }}>
                            ₪{(product.base_price ?? 0).toFixed(2)}
                          </span>
                        </div>
                      ) : (
                        <span style={{
                          fontSize: '18px',
                          fontWeight: 'bold',
                          color: '#333'
                        }}>
                          ₪{(product.base_price ?? 0).toFixed(2)}
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={(e) => handleEdit(product, e)}
                        style={{
                          padding: '10px',
                          backgroundColor: '#2196F3',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          transition: 'all 0.3s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1976D2'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2196F3'}
                      >
                        ✏️
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(product.id, product.name)
                        }}
                        style={{
                          padding: '10px',
                          backgroundColor: '#f44336',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          transition: 'all 0.3s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#d32f2f'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f44336'}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {filteredProducts.length === 0 && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '60px 20px',
            textAlign: 'center',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>📦</div>
            <h3 style={{ color: '#333', marginBottom: '10px' }}>אין מוצרים להצגה</h3>
            <p style={{ color: '#666' }}>
              {selectedCategory !== 'הכל' 
                ? `אין מוצרים בקטגוריה "${selectedCategory}"` 
                : 'לחץ על "הוסף מוצר חדש" כדי להתחיל'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}