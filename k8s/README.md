Kubernetes manifests for fwa services

Apply all manifests:

  kubectl apply -f k8s/

Notes:
- Frontend is exposed as `NodePort` on `30080`. Adjust or replace with an Ingress for production.
- Postgres uses a `StatefulSet` + `PersistentVolumeClaim` (1Gi). Ensure your cluster has a default StorageClass.
- Images are pulled from Docker Hub (`hamoudaakriche/...`). If your images are private, create an imagePullSecret and reference it in the deployments.
