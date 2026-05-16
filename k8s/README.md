Kubernetes manifests for fwa services

Apply all manifests:

  kubectl apply -f k8s/

Azure AKS deployment:

- The GitHub Actions workflow `CD - Deploy to Azure AKS` expects these secrets:
  - `AZURE_CREDENTIALS`
  - `AZURE_AKS_RESOURCE_GROUP`
  - `AZURE_AKS_CLUSTER_NAME`
- It applies the Kubernetes secret first, then the backend and frontend manifests, and finally pins both images to the CI commit SHA.
- The backend still points to the PostgreSQL server URL configured in the manifest, so make sure that URL matches your Azure database.

Notes:
- Frontend is exposed as `NodePort` on `30080`. Adjust or replace with an Ingress for production.
- Postgres uses a `StatefulSet` + `PersistentVolumeClaim` (1Gi). Ensure your cluster has a default StorageClass.
- Images are pulled from Docker Hub (`hamoudaakriche/...`). If your images are private, create an imagePullSecret and reference it in the deployments.
