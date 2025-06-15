import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface SaveAPIKeyRequest {
  provider: string
  apiKey: string
  userId?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Parse request body
    const { provider, apiKey, userId }: SaveAPIKeyRequest = await req.json()

    // Validate input
    if (!provider || !apiKey) {
      return new Response(
        JSON.stringify({ error: 'Provider and API key are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validate provider
    const validProviders = ['openai', 'anthropic', 'google', 'deepseek']
    if (!validProviders.includes(provider.toLowerCase())) {
      return new Response(
        JSON.stringify({ error: 'Invalid provider' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get user ID from auth context or use default
    const finalUserId = userId || 'default-user'

    // Create Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // In a real implementation, you would:
    // 1. Encrypt the API key before storing
    // 2. Store it in a secure table with proper RLS
    // 3. Or use Supabase Vault for secret management
    
    // For this example, we'll simulate storing the encrypted key
    // Note: This is a simplified example - in production you'd use proper encryption
    
    const encryptedKey = btoa(apiKey) // Simple base64 encoding (NOT secure for production)
    
    // Store the encrypted API key in a secure table
    const { data, error } = await supabaseAdmin
      .from('user_api_keys')
      .upsert({
        user_id: finalUserId,
        provider: provider.toLowerCase(),
        encrypted_key: encryptedKey,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,provider'
      })

    if (error) {
      console.error('Database error:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to save API key' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `API key for ${provider} saved successfully`,
        provider: provider.toLowerCase()
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in save-api-key function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})