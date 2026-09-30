# Kubernetes local test deployment

These manifests are a learning/local-cluster baseline, not a production-ready
high-availability database setup. The MongoDB manifest uses one replica and a
cluster-provided persistent volume; configure authentication, backups, network
policies, TLS, secret management, and a supported database topology before
production use.

Build `induscart-backend:latest` from the repository root and load it into the
local cluster (for example, `kind load docker-image induscart-backend:latest`
or `minikube image load induscart-backend:latest`). Create the `induscart-secrets`
Secret with a unique random `JWT_SECRET` of at least 32 characters using your
cluster's secret-management workflow. Do not commit a Secret manifest or real
secret values.

Apply the configuration, MongoDB, and backend resources with:

```sh
kubectl apply -f k8s/config.yaml
kubectl apply -f k8s/mongo.yaml
kubectl apply -f k8s/backend.yaml
```

The backend's liveness/readiness probes use the API's `/health/live` and
`/health/ready` endpoints. Expose the `induscart-backend` ClusterIP only through
an intentional local port-forward or ingress configuration.
