import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface CanvasData {
  id: string
  user_id: string
  canvas_name: string
  nodes: any[]
  edges: any[]
  viewport: {
    x: number
    y: number
    zoom: number
  }
  thumbnail_url?: string
  is_public: boolean
  shared_with?: string[]
  created_at: string
  updated_at: string
}

export interface SharedCanvas {
  id: string
  canvas_id: string
  shared_with_user_id: string
  permission: 'view' | 'edit'
  shared_by_user_id: string
  created_at: string
}

// Canvas operations
export const canvasOperations = {
  // Save canvas data (upsert - insert or update)
  async saveCanvas(canvasData: {
    nodes: any[]
    edges: any[]
    viewport: { x: number; y: number; zoom: number }
    canvasName?: string
    canvasId?: string
    thumbnailUrl?: string
  }) {
    try {
      // Get current user (for now, we'll use a default user)
      // In a real app, you'd get this from authentication
      const userId = 'default-user'
      const canvasName = canvasData.canvasName || 'My Canvas'

      const dataToSave = {
        user_id: userId,
        canvas_name: canvasName,
        nodes: canvasData.nodes,
        edges: canvasData.edges,
        viewport: canvasData.viewport,
        updated_at: new Date().toISOString(),
        ...(canvasData.thumbnailUrl && { thumbnail_url: canvasData.thumbnailUrl })
      }

      let result
      if (canvasData.canvasId) {
        // Update existing canvas
        const { data, error } = await supabase
          .from('canvases')
          .update(dataToSave)
          .eq('id', canvasData.canvasId)
          .select()
          .single()

        if (error) throw error
        result = data
      } else {
        // Create new canvas or upsert by name
        const { data, error } = await supabase
          .from('canvases')
          .upsert(dataToSave, {
            onConflict: 'user_id,canvas_name'
          })
          .select()
          .single()

        if (error) throw error
        result = data
      }

      return result
    } catch (error) {
      console.error('Failed to save canvas:', error)
      throw error
    }
  },

  // Load all canvases for the user (including shared ones)
  async loadAllCanvases() {
    try {
      const userId = 'default-user'

      // Get user's own canvases
      const { data: ownCanvases, error: ownError } = await supabase
        .from('canvases')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })

      if (ownError) throw ownError

      // Get shared canvases
      const { data: sharedCanvases, error: sharedError } = await supabase
        .from('canvas_shares')
        .select(`
          canvas_id,
          permission,
          shared_by_user_id,
          canvases (*)
        `)
        .eq('shared_with_user_id', userId)

      if (sharedError) throw sharedError

      // Combine and format results
      const allCanvases = [
        ...(ownCanvases || []).map(canvas => ({ ...canvas, isOwner: true, permission: 'edit' as const })),
        ...(sharedCanvases || []).map(share => ({ 
          ...share.canvases, 
          isOwner: false, 
          permission: share.permission,
          sharedBy: share.shared_by_user_id
        }))
      ]

      return allCanvases.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    } catch (error) {
      console.error('Failed to load canvases:', error)
      throw error
    }
  },

  // Load a specific canvas
  async loadCanvas(canvasId?: string, canvasName: string = 'My Canvas') {
    try {
      const userId = 'default-user'

      if (canvasId) {
        // Load by ID (could be owned or shared)
        const { data, error } = await supabase
          .from('canvases')
          .select('*')
          .eq('id', canvasId)
          .maybeSingle()

        if (error) throw error

        // Check if user has access
        if (data && data.user_id !== userId) {
          // Check if it's shared with the user
          const { data: shareData, error: shareError } = await supabase
            .from('canvas_shares')
            .select('permission')
            .eq('canvas_id', canvasId)
            .eq('shared_with_user_id', userId)
            .maybeSingle()

          if (shareError || !shareData) {
            throw new Error('Access denied to this canvas')
          }

          return { ...data, permission: shareData.permission, isOwner: false }
        }

        return { ...data, permission: 'edit' as const, isOwner: true }
      } else {
        // Load by name (user's own canvas)
        const { data, error } = await supabase
          .from('canvases')
          .select('*')
          .eq('user_id', userId)
          .eq('canvas_name', canvasName)
          .maybeSingle()

        if (error) throw error
        return data ? { ...data, permission: 'edit' as const, isOwner: true } : null
      }
    } catch (error) {
      console.error('Failed to load canvas:', error)
      throw error
    }
  },

  // Rename a canvas
  async renameCanvas(canvasId: string, newName: string) {
    try {
      const userId = 'default-user'

      const { data, error } = await supabase
        .from('canvases')
        .update({ 
          canvas_name: newName,
          updated_at: new Date().toISOString()
        })
        .eq('id', canvasId)
        .eq('user_id', userId) // Ensure user owns the canvas
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Failed to rename canvas:', error)
      throw error
    }
  },

  // Delete a canvas
  async deleteCanvas(canvasId: string) {
    try {
      const userId = 'default-user'

      // Delete canvas shares first
      await supabase
        .from('canvas_shares')
        .delete()
        .eq('canvas_id', canvasId)

      // Delete the canvas
      const { error } = await supabase
        .from('canvases')
        .delete()
        .eq('id', canvasId)
        .eq('user_id', userId) // Ensure user owns the canvas

      if (error) throw error
    } catch (error) {
      console.error('Failed to delete canvas:', error)
      throw error
    }
  },

  // Share a canvas with another user
  async shareCanvas(canvasId: string, shareWithUserId: string, permission: 'view' | 'edit' = 'view') {
    try {
      const userId = 'default-user'

      // First verify the user owns the canvas
      const { data: canvas, error: canvasError } = await supabase
        .from('canvases')
        .select('id')
        .eq('id', canvasId)
        .eq('user_id', userId)
        .single()

      if (canvasError || !canvas) {
        throw new Error('Canvas not found or access denied')
      }

      // Create or update the share
      const { data, error } = await supabase
        .from('canvas_shares')
        .upsert({
          canvas_id: canvasId,
          shared_with_user_id: shareWithUserId,
          shared_by_user_id: userId,
          permission: permission
        }, {
          onConflict: 'canvas_id,shared_with_user_id'
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Failed to share canvas:', error)
      throw error
    }
  },

  // Remove canvas sharing
  async unshareCanvas(canvasId: string, unshareFromUserId: string) {
    try {
      const userId = 'default-user'

      const { error } = await supabase
        .from('canvas_shares')
        .delete()
        .eq('canvas_id', canvasId)
        .eq('shared_with_user_id', unshareFromUserId)
        .eq('shared_by_user_id', userId)

      if (error) throw error
    } catch (error) {
      console.error('Failed to unshare canvas:', error)
      throw error
    }
  },

  // Get canvas sharing info
  async getCanvasShares(canvasId: string) {
    try {
      const { data, error } = await supabase
        .from('canvas_shares')
        .select('*')
        .eq('canvas_id', canvasId)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Failed to get canvas shares:', error)
      throw error
    }
  },

  // Generate and save canvas thumbnail
  async generateThumbnail(canvasId: string, nodes: any[], edges: any[], viewport: any) {
    try {
      // Create a simple SVG thumbnail based on node positions
      const thumbnailSvg = this.createThumbnailSvg(nodes, edges, viewport)
      
      // Convert SVG to data URL
      const thumbnailUrl = `data:image/svg+xml;base64,${btoa(thumbnailSvg)}`

      // Update canvas with thumbnail
      const { data, error } = await supabase
        .from('canvases')
        .update({ 
          thumbnail_url: thumbnailUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', canvasId)
        .select()
        .single()

      if (error) throw error
      return thumbnailUrl
    } catch (error) {
      console.error('Failed to generate thumbnail:', error)
      throw error
    }
  },

  // Create SVG thumbnail from canvas data
  createThumbnailSvg(nodes: any[], edges: any[], viewport: any) {
    const width = 200
    const height = 150
    const padding = 10

    // Calculate bounds of all nodes
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity

    nodes.forEach(node => {
      const x = node.position.x
      const y = node.position.y
      minX = Math.min(minX, x)
      minY = Math.min(minY, y)
      maxX = Math.max(maxX, x + 250) // Approximate node width
      maxY = Math.max(maxY, y + 150) // Approximate node height
    })

    // If no nodes, return empty thumbnail
    if (nodes.length === 0) {
      return `
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="#1f2937"/>
          <text x="50%" y="50%" text-anchor="middle" fill="#6b7280" font-family="Arial" font-size="12">Empty Canvas</text>
        </svg>
      `
    }

    // Calculate scale to fit all nodes in thumbnail
    const contentWidth = maxX - minX
    const contentHeight = maxY - minY
    const scaleX = (width - padding * 2) / contentWidth
    const scaleY = (height - padding * 2) / contentHeight
    const scale = Math.min(scaleX, scaleY, 1) // Don't scale up

    // Create SVG elements
    const nodeElements = nodes.map(node => {
      const x = (node.position.x - minX) * scale + padding
      const y = (node.position.y - minY) * scale + padding
      const nodeWidth = 250 * scale
      const nodeHeight = 150 * scale

      // Different colors for different node types
      const colors = {
        textNode: '#3b82f6',
        imageNode: '#10b981',
        videoNode: '#f59e0b',
        audioNode: '#8b5cf6',
        documentNode: '#ef4444',
        urlNode: '#06b6d4',
        aiModelNode: '#ec4899'
      }
      
      const color = colors[node.type as keyof typeof colors] || '#6b7280'

      return `<rect x="${x}" y="${y}" width="${nodeWidth}" height="${nodeHeight}" fill="${color}" rx="4" opacity="0.8"/>`
    }).join('')

    const edgeElements = edges.map(edge => {
      const sourceNode = nodes.find(n => n.id === edge.source)
      const targetNode = nodes.find(n => n.id === edge.target)
      
      if (!sourceNode || !targetNode) return ''

      const x1 = (sourceNode.position.x - minX + 250) * scale + padding
      const y1 = (sourceNode.position.y - minY + 75) * scale + padding
      const x2 = (targetNode.position.x - minX) * scale + padding
      const y2 = (targetNode.position.y - minY + 75) * scale + padding

      return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#06b6d4" stroke-width="1" opacity="0.6"/>`
    }).join('')

    return `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#111827"/>
        ${edgeElements}
        ${nodeElements}
      </svg>
    `
  },

  // Clean up old canvas versions (keep only the latest)
  async cleanupOldVersions(canvasName: string = 'My Canvas') {
    try {
      const userId = 'default-user'

      // Get all canvases for this user and canvas name, ordered by updated_at
      const { data: allCanvases, error: fetchError } = await supabase
        .from('canvases')
        .select('id, updated_at')
        .eq('user_id', userId)
        .eq('canvas_name', canvasName)
        .order('updated_at', { ascending: false })

      if (fetchError) {
        console.error('Error fetching canvases for cleanup:', fetchError)
        return
      }

      // If we have more than 1 canvas, delete the older ones
      if (allCanvases && allCanvases.length > 1) {
        const canvasesToDelete = allCanvases.slice(1) // Keep the first (latest), delete the rest
        const idsToDelete = canvasesToDelete.map(canvas => canvas.id)

        const { error: deleteError } = await supabase
          .from('canvases')
          .delete()
          .in('id', idsToDelete)

        if (deleteError) {
          console.error('Error deleting old canvas versions:', deleteError)
        } else {
        }
      }
    } catch (error) {
      console.error('Failed to cleanup old versions:', error)
    }
  },

  // Get canvas history (for debugging or recovery)
  async getCanvasHistory(canvasName: string = 'My Canvas', limit: number = 10) {
    try {
      const userId = 'default-user'

      const { data, error } = await supabase
        .from('canvases')
        .select('id, updated_at, created_at')
        .eq('user_id', userId)
        .eq('canvas_name', canvasName)
        .order('updated_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error fetching canvas history:', error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Failed to get canvas history:', error)
      throw error
    }
  }
}
