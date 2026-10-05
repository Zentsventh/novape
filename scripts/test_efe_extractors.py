import unittest
from collect_efe_catalog import ListingParser, clean, brand_key

class ListingTests(unittest.TestCase):
    def test_brand_spelling_variants_do_not_count_as_distinct_brands(self):
        self.assertEqual(brand_key('Paraiso'), brand_key('Paraíso'))
        self.assertEqual(brand_key('GENERICO'), brand_key('Genérico'))
        self.assertNotEqual(brand_key('Samsung'), brand_key('LG'))

    def test_product_text_excludes_embedded_styles_and_javascript(self):
        self.assertEqual(clean('<style>.bose-wrap{color:red}</style><p>Parlante Bose S1 Pro</p>'
                               '<script>window.widget = true;</script>'), 'Parlante Bose S1 Pro')

    def test_encoded_comparisons_are_preserved_in_product_specs(self):
        self.assertEqual(clean('<p>Voltaje &lt; 220 V</p>'), 'Voltaje < 220 V')

    def test_nested_photo_and_swatch_lists_do_not_hide_product_links(self):
        parser = ListingParser()
        parser.feed('<ol class="products list items product-items "><li class="item product product-item">'
                    '<ul><li>Photo 1</li><li>Photo 2</li></ul><span class="brand-name">Samsung</span>'
                    '<a class="product-item-link" href="/phone.html">Phone</a></li></ol>')
        self.assertEqual(parser.products, [{'url': 'https://www.efe.com.pe/phone.html', 'brand': 'Samsung'}])

    def test_recommendations_outside_the_category_listing_are_excluded(self):
        parser = ListingParser()
        parser.feed('<ol class="products list items product-items"><li class="product-item">'
                    '<span class="brand-name">Apple</span><a class="product-item-link" href="/first.html">First</a>'
                    '</li></ol><ol class="widget product-items"><li class="product-item">'
                    '<a class="product-item-link" href="/unrelated.html">Related</a></li></ol>')
        self.assertEqual(len(parser.products), 1)
        self.assertTrue(parser.products[0]['url'].endswith('/first.html'))

if __name__ == '__main__':
    unittest.main()
