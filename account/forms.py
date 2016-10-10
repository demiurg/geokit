from django.contrib.auth.models import User
from django.core.validators import RegexValidator
from django.utils.translation import ugettext_lazy as _
from django import forms
from crispy_forms.helper import FormHelper
from crispy_forms.layout import Layout, Fieldset, ButtonHolder, Submit, Div, Field

from models import GeoKitSite


class CrispyForm(object):
    def __init__(self, *args, **kwargs):
        super(CrispyForm, self).__init__(*args, **kwargs)

        self.helper = FormHelper()
        self.helper.form_action = self.form_action

        if (self.no_labels is not None and self.no_labels == True):
            layout = self.helper.layout = Layout()
            for field_name, field in self.fields.items():
                layout.append(Field(field_name, placeholder=field.label))
            self.helper.form_show_labels = False

        if (self.form_class is not None and self.form_class == 'form-horizontal'):
            self.helper.label_class = 'col-md-4 col-sm-12 col-xs 12'
            self.helper.form_class = 'form-horizontal'
            self.helper.field_class = 'col-md-8 col-sm-12 col-xs-12'
            self.helper.add_input(Submit('submit', 'Submit', css_class='col-sm-offset-4'))
        elif (self.form_class is not None):
            self.helper.form_class = self.form_class
        else:
            self.helper.add_input(Submit('submit', 'Submit'))


attrs_dict = {'class': 'required', 'style': 'font-weight: bold;'}

class LoginForm(CrispyForm, forms.Form):
    def __init__(self, *args, **kwargs):
        self.form_class = kwargs.pop('form_class', None)
        self.no_labels = kwargs.pop('no_labels', None)
        self.form_action = kwargs.pop('form_action', None)

        super(LoginForm, self).__init__(*args, **kwargs)

    email = forms.EmailField(
        widget=forms.TextInput(attrs=dict(attrs_dict, maxlength=75)),
        label=_("Email address")
    )
    password = forms.CharField(
        widget=forms.PasswordInput(attrs=attrs_dict, render_value=False),
        label=_("Password")
    )


class GeoKitSiteForm(CrispyForm, forms.ModelForm):
    def __init__(self, *args, **kwargs):
        self.form_class = kwargs.pop('form_class', None)
        self.no_labels = kwargs.pop('no_labels', None)
        self.form_action = kwargs.pop('form_action', None)

        super(GeoKitSiteForm, self).__init__(*args, **kwargs)
        

    schema_name = forms.CharField(
        label=_("URL name"),
        help_text=(
            'Please only use lowercase letters and numbers: a-z, 0-9.<br>'
            'Changing this value will invalidate previous urls!'
        ),
        required=True,
        validators=[
            RegexValidator(
                '^[a-z0-9]+$',
                message='Site url name must be lowecase Alphanumeric'
            )
        ]
    )
    name = forms.CharField(
        label=_("Full name"),
        help_text='This is a more descriptive name for your GeoKit site.'
    )

    class Meta:
        model = GeoKitSite
        fields = ('schema_name', 'name',)


class SignupSiteForm(GeoKitSiteForm, forms.Form):
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

    def clean_email1(self):
        """
        Validate that the supplied email address is unique for the
        site.
        """
        email1 = self.cleaned_data['email1']
        if User.objects.filter(email__iexact=email1).count():
            raise forms.ValidationError(_(
                u'This email address is already in use. '
                'Please supply a different email address.'
            ))
        return self.cleaned_data['email1']

    def clean_email2(self):
        email1 = self.cleaned_data.get('email1')
        email2 = self.cleaned_data.get('email2')
        if email2 and email2 and email1 != email2:
                raise forms.ValidationError(_("The emails must match."))
        return self.cleaned_data

class SignupForm(CrispyForm, forms.Form):
    def __init__(self, *args, **kwargs):
        self.form_class = kwargs.pop('form_class', None)
        self.no_labels = kwargs.pop('no_labels', None)
        self.form_action = kwargs.pop('form_action', None)

        super(SignupForm, self).__init__(*args, **kwargs)
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

    def clean_email1(self):
        """
        Validate that the supplied email address is unique for the
        site.
        """
        email1 = self.cleaned_data['email1']
        if User.objects.filter(email__iexact=email1).count():
            raise forms.ValidationError(_(
                u'This email address is already in use. '
                'Please supply a different email address.'
            ))
        return self.cleaned_data['email1']

    def clean_email2(self):
        email1 = self.cleaned_data.get('email1')
        email2 = self.cleaned_data.get('email2')
        if email2 and email2 and email1 != email2:
                raise forms.ValidationError(_("The emails must match."))
        return self.cleaned_data