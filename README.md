GCP Resources
=============

Find GCP resources that are likely unused.

#### 1. Create View-Only Credentials

```shell
# Create a new service account
export PROJECT_ID="..."
IAM_ID=$(
gcloud iam service-accounts create ${unused-resources} \
  --display-name "Unused Resources" \
  --format 'value(email)'
)

# Authorize the new account to view-only
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member ${IAM_ID}
  --role "roles/viewer"

# Download a keyfile
gcloud iam service-accounts keys create keyfile.json \
  --iam-account $IAM_ID

```

#### 2. Scan For Resources

```shell
node unused-networking.js
```


### Resources

* [GCP Client Libs](https://cloud.google.com/apis/docs/cloud-client-libraries)
* [Google Node Libs](https://github.com/google/google-api-nodejs-client)
