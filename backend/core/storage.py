"""
File storage abstraction for MediID.
Uses local storage in dev, can be swapped to S3 in production.
"""
import os
from django.conf import settings


def get_file_url(relative_path: str) -> str:
    """
    Get the URL for a stored file.
    In development: returns a local media URL.
    In production: would generate a signed S3 URL.
    """
    if settings.DEBUG:
        return f"{settings.MEDIA_URL.rstrip('/')}/{relative_path.lstrip('/')}"
    # Production: generate signed S3 URL
    # Uncomment and configure when deploying:
    # import boto3
    # s3 = boto3.client(
    #     's3',
    #     aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
    #     aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
    #     region_name=settings.AWS_REGION,
    # )
    # return s3.generate_presigned_url(
    #     'get_object',
    #     Params={'Bucket': settings.AWS_STORAGE_BUCKET_NAME, 'Key': relative_path},
    #     ExpiresIn=300,
    # )
    return f"{settings.MEDIA_URL.rstrip('/')}/{relative_path.lstrip('/')}"


def save_uploaded_file(uploaded_file, directory: str, filename: str) -> str:
    """
    Save an uploaded file to local storage.
    Returns the relative path.
    """
    upload_dir = os.path.join(settings.MEDIA_ROOT, directory)
    os.makedirs(upload_dir, exist_ok=True)

    relative_path = f"{directory}/{filename}"
    full_path = os.path.join(settings.MEDIA_ROOT, relative_path)

    with open(full_path, 'wb+') as destination:
        for chunk in uploaded_file.chunks():
            destination.write(chunk)

    return relative_path
