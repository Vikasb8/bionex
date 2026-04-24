from django.urls import path
from .views import FamilyAddView, FamilyListView, FamilyDeleteView

urlpatterns = [
    path('add/', FamilyAddView.as_view(), name='family-add'),
    path('list/', FamilyListView.as_view(), name='family-list'),
    path('<uuid:pk>/', FamilyDeleteView.as_view(), name='family-delete'),
]
