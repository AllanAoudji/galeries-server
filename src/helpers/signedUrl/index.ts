import gc from '../gc';

export default async (bucketName: string, fileName: string) => {
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const galeriesBucket = gc.bucket(bucketName);
  const blob = galeriesBucket.file(fileName);
  const signedUrl = await blob.getSignedUrl({
    action: 'read',
    expires,
  });

  return signedUrl[0];
};
