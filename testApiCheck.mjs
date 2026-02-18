const BASE = process.env.VITE_API_BASE || 'http://localhost:5000';

async function run() {
  try {
    console.log('Fetching societies...');
    const socResp = await fetch(`${BASE}/api/societies`);
    const socData = await socResp.json();
    console.log('=== SOCIETIES ===');
    console.log(JSON.stringify(socData, null, 2));

    let firstSocId = null;
    if (Array.isArray(socData) && socData.length) firstSocId = socData[0]._id || socData[0].id;
    else if (socData?.data && socData.data.length) firstSocId = socData.data[0]._id || socData.data[0].id;
    console.log('FIRST_SOCIETY_ID:', firstSocId);

    if (!firstSocId) {
      console.log('No society id found, exiting');
      return;
    }

    // Fetch flats for every society and print counts
    const societiesList = Array.isArray(socData) ? socData : (socData?.data || []);
    for (const soc of societiesList) {
      const sid = soc._id || soc.id;
      console.log(`\nFetching flats for society ${sid} (${soc.name})...`);
      const flatsResp = await fetch(`${BASE}/api/flats?society=${sid}`);
      const flatsData = await flatsResp.json();
      console.log(JSON.stringify({ society: soc.name, societyId: sid, flats: flatsData }, null, 2));

      let firstFlatId = null;
      if (Array.isArray(flatsData) && flatsData.length) firstFlatId = flatsData[0]._id || flatsData[0].id;
      else if (flatsData?.data && flatsData.data.length) firstFlatId = flatsData.data[0]._id || flatsData.data[0].id;

      console.log('FIRST_FLAT_ID_FOR_SOCIETY:', firstFlatId);

      if (firstFlatId) {
        console.log(`Fetching residents for flat ${firstFlatId}...`);
        const resResp = await fetch(`${BASE}/api/residents?flatId=${firstFlatId}`);
        const resData = await resResp.json();
        console.log('RESIDENTS:', JSON.stringify(resData, null, 2));
      } else {
        console.log('No flat id to query residents for this society');
      }
    }
  } catch (err) {
    console.error('TEST SCRIPT ERROR:', err);
    process.exit(1);
  }
}

run();
