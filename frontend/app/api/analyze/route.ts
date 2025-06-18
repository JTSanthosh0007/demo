import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const platform = formData.get('platform') as string

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Temporary mock response for testing the UI
    return NextResponse.json({
      transactions: [
        {
          date: '2024-03-01',
          amount: -500,
          description: 'Sample Transaction 1',
          category: 'Shopping'
        },
        {
          date: '2024-03-02',
          amount: 1000,
          description: 'Sample Income',
          category: 'Income'
        },
        {
          date: '2024-03-03',
          amount: -300,
          description: 'Sample Transaction 2',
          category: 'Food'
        }
      ],
      totalSpent: -800,
      totalReceived: 1000,
      categoryBreakdown: {
        'Shopping': -500,
        'Food': -300
      }
    })

  } catch (error) {
    console.error('Error processing statement:', error)
    return NextResponse.json(
      { error: 'Error processing statement' },
      { status: 500 }
    )
  }
} 