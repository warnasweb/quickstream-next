// app/api/payment-dates/route.js
import { NextResponse } from 'next/server'
import { DateTime, Interval } from 'luxon'

export const runtime = 'edge' // Use edge runtime for better performance
export default async function handler(request, res) {
  if (request.method !== "POST") {
    return request.status(405).json({ message: "Method not allowed" });
  }

  
//export default async function POST(request) {
 try {
    const requestData = await request.json()
    console.log('Received data:', requestData)

    const {
      currentPaymentDate,
      statementGenerated,
      cycleType,
      paymentMadeForCurrentCycle
    } = requestData

    // Validate input
    if (!currentPaymentDate || typeof statementGenerated !== 'boolean' || 
        !['monthly', 'fortnightly'].includes(cycleType) || 
        typeof paymentMadeForCurrentCycle !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid input parameters' },
        { status: 400 }
      )
    }

    const now = DateTime.now()
    const currentDate = DateTime.fromISO(currentPaymentDate)
    
    if (!currentDate.isValid) {
      return NextResponse.json(
        { error: 'Invalid current payment date' },
        { status: 400 }
      )
    }

    if (!statementGenerated) {
      return NextResponse.json({ availableDates: [] })
    }

    const availableDates = []
    const currentMonth = now.month
    const currentYear = now.year

    if (cycleType === 'monthly') {
      // For monthly cycles, find all Tuesdays and Thursdays in current month
      // starting from tomorrow (or today if time is considered)
      let currentCandidate = now.plus({ days: 1 }).startOf('day') // Start from tomorrow
      
      while (currentCandidate.month === currentMonth && currentCandidate.year === currentYear) {
        if (currentCandidate.weekday === 2 || currentCandidate.weekday === 4) { // Tuesday or Thursday
          availableDates.push(currentCandidate.toISODate())
        }
        currentCandidate = currentCandidate.plus({ days: 1 })
      }
      
    } else if (cycleType === 'fortnightly') {
      // For fortnightly cycles, only include current cycle if payment not made
      if (!paymentMadeForCurrentCycle) {
        const nextCycleDate = currentDate.plus({ days: 14 })
        
        let currentCandidate = now.plus({ days: 1 }).startOf('day') // Start from tomorrow
        while (currentCandidate < nextCycleDate && 
               currentCandidate.month === currentMonth && 
               currentCandidate.year === currentYear) {
          if (currentCandidate.weekday === 2 || currentCandidate.weekday === 4) {
            availableDates.push(currentCandidate.toISODate())
          }
          currentCandidate = currentCandidate.plus({ days: 1 })
        }
      }
    }

    return NextResponse.json({ availableDates })
  } catch (error) {
    console.error('Error processing payment dates:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}