import unittest

from expressions import helpers


class TestExpressionResultEquality(unittest.TestCase):
    def setUp(self):
        """Make some objects for each test."""
        self.scalar_er = helpers.ExpressionResult.scalar(37)
        self.rect_vals = [
            [1, 2, 3, 4, 5],
            [2, 3, 4, 5, 6],
            [3, 4, 5, 6, 7],
        ]
        self.rect_er = helpers.ExpressionResult(self.rect_vals)

    def test_wrong_type(self):
        """ER objects should not be equal to non-ER objects."""
        self.assertNotEqual(self.scalar_er, object())

    def test_scalar_identity(self):
        """An ER object should be equal to itself."""
        self.assertEqual(self.scalar_er, self.scalar_er)

    def test_rect_identity(self):
        """An ER object should be equal to itself."""
        self.assertEqual(self.rect_er, self.rect_er)

    def test_unequal_dimensions(self):
        """ERs should be unequal when their dimensions don't match."""
        extra_row = [4, 5, 6, 7, 8]
        rect_er_2 = helpers.ExpressionResult(self.rect_vals + [extra_row])
        self.assertNotEqual(self.rect_er, rect_er_2)

    def test_differing_key(self):
        """ER objects that only vary in one key should be unequal."""
        self.rect_er.temporal_key.append(5)
        rect_er_2 = helpers.ExpressionResult(self.rect_vals)
        self.assertNotEqual(self.rect_er, rect_er_2)


if __name__ == '__main__':
    unittest.main()