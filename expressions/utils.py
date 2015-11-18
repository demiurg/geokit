import md5
import os

from django.conf import settings

from expressions.models import Expression


def tile_patch_expression(func):
    def wrapped_function(request, layer_name, z, x, y, expression_id):
        x, y, z = int(x), int(y), int(z)

        patch_query = Expression.objects.get(pk=expression_id).evaluation_query(request)
        patch_hash = md5.md5(patch_query).hexdigest()
        tile_patch_path = os.path.realpath(settings.STATIC_ROOT + '/tile_patches/' + patch_hash)

        if not os.path.isfile(tile_patch_path):
            with open(tile_patch_path, 'w') as f:
                f.write(patch_query)

        return func(request, layer_name, z, x, y, expression_id)
    return wrapped_function
