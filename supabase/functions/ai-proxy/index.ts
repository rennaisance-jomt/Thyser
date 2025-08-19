import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface AIProxyRequest {
  provider: string
  model: string
  prompt: string
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
    const { provider, model, prompt, userId }: AIProxyRequest = await req.json()

    // Validate input
    if (!provider || !model || !prompt) {
      return new Response(
        JSON.stringify({ error: 'Provider, model, and prompt are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get user ID from auth context or use default
    const finalUserId = userId || 'default-user'

    // Create Supabase client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Retrieve the encrypted API key for this user and provider
    const { data: keyData, error: keyError } = await supabaseAdmin
      .from('user_api_keys')
      .select('encrypted_key')
      .eq('user_id', finalUserId)
      .eq('provider', provider.toLowerCase())
      .maybeSingle()

    if (keyError || !keyData) {
      return new Response(
        JSON.stringify({ error: `No API key found for ${provider}. Please configure your API key in settings.` }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Decrypt the API key (in production, use proper encryption)
    const apiKey = atob(keyData.encrypted_key)

    // Make the actual API call to the AI provider
    let response: Response
    let responseData: any

    switch (provider.toLowerCase()) {
      case 'openai':
        response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: model,
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 1000,
            temperature: 0.7,
          }),
        })
        
        responseData = await response.json()
        
        if (!response.ok) {
          throw new Error(`OpenAI API error: ${responseData.error?.message || 'Unknown error'}`)
        }
        
        return new Response(
          JSON.stringify({
            success: true,
            response: responseData.choices[0]?.message?.content || 'No response generated',
            provider: 'OpenAI',
            model: model
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )

      case 'anthropic':
        response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': apiKey,
            'Content-Type': 'application/json',
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: model,
            max_tokens: 1000,
            messages: [{ role: 'user', content: prompt }],
          }),
        })
        
        responseData = await response.json()
        
        if (!response.ok) {
          throw new Error(`Anthropic API error: ${responseData.error?.message || 'Unknown error'}`)
        }
        
        return new Response(
          JSON.stringify({
            success: true,
            response: responseData.content[0]?.text || 'No response generated',
            provider: 'Anthropic',
            model: model
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )

      case 'google':
        // Google Gemini API implementation
        response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: prompt }]
            }],
            generationConfig: {
              maxOutputTokens: 1000,
              temperature: 0.7,
            }
          }),
        })
        
        responseData = await response.json()
        
        if (!response.ok) {
          throw new Error(`Google API error: ${responseData.error?.message || 'Unknown error'}`)
        }
        
        return new Response(
          JSON.stringify({
            success: true,
            response: responseData.candidates[0]?.content?.parts[0]?.text || 'No response generated',
            provider: 'Google',
            model: model
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )

      case 'deepseek':
        // Deepseek API implementation (similar to OpenAI format)
        response = await fetch('https://api.deepseek.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: model,
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 1000,
            temperature: 0.7,
          }),
        })
        
        responseData = await response.json()
        
        if (!response.ok) {
          throw new Error(`Deepseek API error: ${responseData.error?.message || 'Unknown error'}`)
        }
        
        return new Response(
          JSON.stringify({
            success: true,
            response: responseData.choices[0]?.message?.content || 'No response generated',
            provider: 'Deepseek',
            model: model
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )

      default:
        return new Response(
          JSON.stringify({ error: `Unsupported provider: ${provider}` }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
    }

  } catch (error) {
    console.error('Error in ai-proxy function:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        success: false
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})