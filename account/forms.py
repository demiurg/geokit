from django.contrib.auth.models import User
from django.utils.translation import ugettext_lazy as _
from django import forms
from crispy_forms.helper import FormHelper
from crispy_forms.layout import Layout, Fieldset, ButtonHolder, Submit, Div


class BootstrapForm(forms.Form):
    def __init__(self, *args, **kwargs):
        super(BootstrapForm, self).__init__(*args, **kwargs)
        self.helper = FormHelper()
        self.helper.form_class = 'form-horizontal'
        self.helper.label_class = 'col-md-4 col-sm-12 col-xs 12'
        self.helper.field_class = 'col-md-8 col-sm-12 col-xs-12'
        self.helper.add_input(Submit('submit', 'Save', css_class='col-sm-offset-4'))


attrs_dict = {'class': 'required', 'style': 'font-weight: bold;'}


class SignupForm(BootstrapForm):
    """
    Form for registering a new user account.

    Validates that the requested username is not already in use, and
    requires the password to be entered twice to catch typos.

    Subclasses should feel free to add any additional validation they
    need, but should avoid defining a ``save()`` method -- the actual
    saving of collected user data is delegated to the active
    registration backend.

    """

    first_name = forms.CharField(max_length=30, label=_("First name"), required=True)
    last_name = forms.CharField(max_length=30, label=_("Last name"), required=True)

    email1 = forms.EmailField(
        widget=forms.TextInput(attrs=dict(attrs_dict, maxlength=75)),
        label=_("Email address")
    )
    email2 = forms.EmailField(
        widget=forms.TextInput(attrs=dict(attrs_dict, maxlength=75)),
        label=_("Email confirmation")
    )

    def clean_email(self):
        """
        Validate that the supplied email address is unique for the
        site.
        """

        if User.objects.filter(email__iexact=self.cleaned_data['email']).count():
            raise forms.ValidationError(_(u'This email address is already in use. Please supply a different email address.'))
        return self.cleaned_data['email']

    def clean(self):
        if 'email1' in self.cleaned_data and 'email2' in self.cleaned_data:
            if self.cleaned_data['email1'] != self.cleaned_data['email2']:
                raise forms.ValidationError(_("The two emails didn't match."))
        return self.cleaned_data
