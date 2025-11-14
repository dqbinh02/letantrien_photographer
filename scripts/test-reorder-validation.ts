/**
 * Validation Test: Reorder API Endpoint
 * 
 * Tests error handling and validation logic
 * 
 * Prerequisites: Dev server running (npm run dev)
 * 
 * Usage: npx tsx scripts/test-reorder-validation.ts
 */

import { config } from 'dotenv';
import { MongoClient } from 'mongodb';
import path from 'path';

config({ path: path.resolve(process.cwd(), '.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB || 'photographer_portfolio';
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

interface TestCase {
  name: string;
  albumId: string;
  body: any;
  expectedStatus: number;
  expectedError?: string;
}

async function runValidationTests() {
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI not found');
    process.exit(1);
  }

  console.log('🔗 Connecting to MongoDB...');
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    
    // Get a valid album ID and media ID
    const sampleMedia = await db.collection('media').findOne({});
    if (!sampleMedia) {
      console.log('❌ No media found for testing');
      return;
    }
    
    const validAlbumId = sampleMedia.albumId.toString();
    const validMediaId = sampleMedia._id.toString();
    
    // Get a media from different album (if exists) for security test
    const otherMedia = await db.collection('media').findOne({
      albumId: { $ne: sampleMedia.albumId }
    });
    
    console.log('✅ Connected and found test data\n');
    
    // Define test cases
    const testCases: TestCase[] = [
      {
        name: 'Invalid album ID format',
        albumId: 'not-a-valid-objectid',
        body: { mediaOrders: [{ mediaId: validMediaId, order: 0 }] },
        expectedStatus: 400,
        expectedError: 'Invalid album ID format'
      },
      {
        name: 'Album not found',
        albumId: '000000000000000000000000',
        body: { mediaOrders: [{ mediaId: validMediaId, order: 0 }] },
        expectedStatus: 404,
        expectedError: 'Album not found'
      },
      {
        name: 'Missing mediaOrders field',
        albumId: validAlbumId,
        body: {},
        expectedStatus: 400,
        expectedError: 'mediaOrders must be an array'
      },
      {
        name: 'mediaOrders is not array',
        albumId: validAlbumId,
        body: { mediaOrders: 'not-an-array' },
        expectedStatus: 400,
        expectedError: 'mediaOrders must be an array'
      },
      {
        name: 'Empty mediaOrders array',
        albumId: validAlbumId,
        body: { mediaOrders: [] },
        expectedStatus: 400,
        expectedError: 'mediaOrders array cannot be empty'
      },
      {
        name: 'Invalid mediaId format',
        albumId: validAlbumId,
        body: { mediaOrders: [{ mediaId: 'invalid', order: 0 }] },
        expectedStatus: 400,
        expectedError: 'Invalid mediaId format'
      },
      {
        name: 'Missing order field',
        albumId: validAlbumId,
        body: { mediaOrders: [{ mediaId: validMediaId }] },
        expectedStatus: 400,
        expectedError: 'valid order number'
      },
      {
        name: 'Negative order value',
        albumId: validAlbumId,
        body: { mediaOrders: [{ mediaId: validMediaId, order: -1 }] },
        expectedStatus: 400,
        expectedError: 'valid order number'
      },
      {
        name: 'Media does not belong to album',
        albumId: validAlbumId,
        body: { mediaOrders: [{ mediaId: '000000000000000000000001', order: 0 }] },
        expectedStatus: 403,
        expectedError: 'do not belong to this album'
      }
    ];
    
    // Run tests
    let passed = 0;
    let failed = 0;
    
    for (const testCase of testCases) {
      process.stdout.write(`🧪 ${testCase.name}... `);
      
      try {
        const response = await fetch(
          `${API_BASE}/api/admin/albums/${testCase.albumId}/reorder`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testCase.body)
          }
        );
        
        const data = await response.json();
        
        if (response.status === testCase.expectedStatus) {
          if (testCase.expectedError) {
            if (data.error?.includes(testCase.expectedError)) {
              console.log('✅ PASS');
              passed++;
            } else {
              console.log(`❌ FAIL - Wrong error message`);
              console.log(`   Expected: "${testCase.expectedError}"`);
              console.log(`   Got: "${data.error}"`);
              failed++;
            }
          } else {
            console.log('✅ PASS');
            passed++;
          }
        } else {
          console.log(`❌ FAIL - Wrong status code`);
          console.log(`   Expected: ${testCase.expectedStatus}`);
          console.log(`   Got: ${response.status}`);
          console.log(`   Response:`, data);
          failed++;
        }
      } catch (error) {
        if (error instanceof Error && error.message.includes('ECONNREFUSED')) {
          console.log('❌ FAIL - Server not running');
          console.log('\n⚠️  Dev server not running. Start it with: npm run dev');
          process.exit(1);
        }
        console.log(`❌ FAIL - ${error}`);
        failed++;
      }
    }
    
    // Summary
    console.log('\n' + '='.repeat(50));
    console.log(`📊 Test Results: ${passed} passed, ${failed} failed`);
    console.log('='.repeat(50));
    
    if (failed === 0) {
      console.log('✅ All validation tests passed!');
    } else {
      console.log(`❌ ${failed} test(s) failed`);
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

runValidationTests().catch(console.error);
