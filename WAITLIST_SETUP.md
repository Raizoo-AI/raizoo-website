# Waitlist — how it works (AWS, fully automatic)

The landing-page form posts each signup to an AWS Lambda that appends it to
`waitlist.csv` and `waitlist.json` in a **private** S3 bucket. No server to run,
no manual steps — signups are saved automatically.

## Resources (AWS account 771266824847, us-east-1)

| Thing | Value |
|-------|-------|
| Endpoint (in `script.js`) | `https://wgmcc22seg.execute-api.us-east-1.amazonaws.com/` |
| Lambda | `raizoo-waitlist` |
| API Gateway (HTTP API) | `raizoo-waitlist-api` (id `wgmcc22seg`) |
| IAM role | `raizoo-waitlist-lambda-role` |
| Data bucket (private) | `s3://raizoo-waitlist-771266824847/` |
| Files | `waitlist.csv`, `waitlist.json` |

The data bucket has all public access blocked — signup emails are never public.
(The site itself is public in `s3://www.raizoo.ai`; the data is separate.)

## View / download signups

```bash
aws s3 cp s3://raizoo-waitlist-771266824847/waitlist.csv ./waitlist.csv
# or view inline:
aws s3 cp s3://raizoo-waitlist-771266824847/waitlist.csv -
```

## Behaviour

- New email → `200 {ok:true}` → "You're on the list!"
- Repeat email → `200 {ok:true, already:true}` → "You're already on the list!" (de-duped in `waitlist.json`)
- Bad email → `400 {error:"invalid_email"}`

## Updating the Lambda code

Edit the handler, then:

```bash
cd <lambda-dir>            # contains index.js
zip -r function.zip index.js
aws lambda update-function-code --function-name raizoo-waitlist \
  --zip-file fileb://function.zip --region us-east-1
```

CORS is configured on the API Gateway (`AllowOrigins=*`, `POST/OPTIONS`), so the
static site can call it cross-origin from raizoo.ai / ibu-ai.com.

> Note: a Lambda **Function URL** was tried first but returns 403 in this account
> (an org policy blocks unauthenticated function URLs), so the API Gateway HTTP
> API is used instead.
