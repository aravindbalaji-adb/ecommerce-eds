export default async function decorate(block) {
    console.log("block: ", block);
  const rows = [...block.children];
  console.log("rows: ", rows);

  const jsonLink = rows[1]?.querySelector('a');
  const jsonUrl = jsonLink?.href || rows[1]?.textContent.trim();

  if (!jsonUrl) return;

  try {
    const response = await fetch(jsonUrl);

    if (!response.ok) {
      throw new Error(`Unable to load products: ${response.status}`);
    }

    const json = await response.json();
    const products = json.data || [];

    block.innerHTML = '';

    const productGrid = document.createElement('div');
    productGrid.className = 'spot-light-grid';

    products.forEach((product) => {
      if (!product['Image URL']) return;

      const link = document.createElement('a');
      link.className = 'spot-light-item';

      // Product Detail Page URL
      link.href = `/products/${product.ID}`;

      const image = document.createElement('img');

      image.src = product['Image URL'];
      image.alt = product.Title || 'Product';
      image.loading = 'lazy';

      link.append(image);
      productGrid.append(link);
    });

    block.append(productGrid);
  } catch (error) {
    console.error('Spot Light block error:', error);
  }
}