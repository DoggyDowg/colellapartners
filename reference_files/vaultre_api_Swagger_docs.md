Swagger UI
Select a definition

VaultRE v1.3
VaultRE
 1.3 
OAS3
https://docs.api.vaultre.com.au/swagger/vaultre.yaml
Please ensure all API requests use HTTP/1.1. See https://github.com/VaultGroup/api-samples for code samples.

VaultRE - Website
Send email to VaultRE
Servers

https://ap-southeast-2.api.vaultre.com.au/api/v1.3
Filter by tag
advertising
Operations related to property and agent advertising


GET
​/advertising​/invoices
Retrieve a list of advertising invoices

GET
​/advertising​/invoices​/{id}
Retrieve a single advertising invoice

GET
​/advertising​/schedules
Retrieve a list of advertising schedules

GET
​/advertising​/schedules​/{id}
Retrieve a single advertising schedule

GET
​/advertising​/suppliers
Retrieve a list of advertising suppliers

POST
​/advertising​/suppliers
Add a new advertising supplier

GET
​/advertising​/suppliers​/{id}
Retrieve a single advertising supplier

PUT
​/advertising​/suppliers​/{id}
Update an advertising supplier

DELETE
​/advertising​/suppliers​/{id}
Delete an advertising supplier

GET
​/advertising​/expenseTypes
Retrieve a list of advertising expense types

GET
​/advertising​/expenseTypes​/{id}
Retrieve a single advertising expense type

GET
​/properties​/{propertyid}​/sale​/{lifeid}​/advertising​/schedule
Retrieve the attached advertising schedule for this property

GET
​/properties​/{propertyid}​/sale​/{lifeid}​/advertising​/transactions
Retrieve a list of property advertising transactions

GET
​/types​/advertising​/transactions
Retrieve a list of advertising transaction types

GET
​/types​/advertising​/payments
Retrieve a list of advertising payment types

POST
​/advertising​/payments
Add an Advertising Payment
categories
Operations related to categories


GET
​/categories​/contact​/groups
Retrieve a list of contact category groups

POST
​/categories​/contact​/groups
Create a contact category grouping

GET
​/categories​/contact​/groups​/{id}
Retrieve a single contact category group

PUT
​/categories​/contact​/groups​/{id}
Update a contact category grouping

GET
​/categories​/contact​/groups​/{id}​/categories
Retrieve a list of categories in this contact category group

POST
​/categories​/contact​/groups​/{id}​/categories
Create a contact category in this grouping

GET
​/categories​/contact​/groups​/{groupingid}​/categories​/{id}
Retrieve a single category in this contact category group

PUT
​/categories​/contact​/groups​/{groupingid}​/categories​/{id}
Update a contact category in this grouping

GET
​/categories​/contact
Retrieve a list of contact categories

GET
​/categories​/contact​/{id}
Retrieve a single contact category

GET
​/categories​/property​/groups
Retrieve a list of property category groups

GET
​/categories​/property​/groups​/{id}
Retrieve a single property category group

GET
​/categories​/property
Retrieve a list of property categories

GET
​/categories​/property​/{id}
Retrieve a single property category

lists
Operations related to distribution lists


GET
​/distributionLists​/contact
Retrieve a list of contact distribution lists for this account

GET
​/distributionLists​/contact​/{id}
Retrieve a single contact distribution list

contacts
Operations related to contacts


GET
​/contacts
Retrieve a list of contacts

POST
​/contacts
Create a contact

GET
​/contacts​/{id}
Retrieve a single contact

PUT
​/contacts​/{id}
Update a single contact

DELETE
​/contacts​/{id}
Delete a contact

POST
​/contacts​/{id}​/sms
Send an SMS to this contact

POST
​/contacts​/sms
Send multiple SMS messages to contacts

POST
​/contacts​/{id}​/email
Send an email to this contact

POST
​/contacts​/email
Send multiple emails to contacts

GET
​/contacts​/{id}​/context
Retrieve contextual information about this contact

GET
​/contacts​/recentlyAccessed
Retrieve a list of recently accessed contacts

GET
​/contacts​/{id}​/notes
Retrieve a list of notes attached to this contact

POST
​/contacts​/{id}​/notes
Add a note to this contact

POST
​/contacts​/notes
Add multiple contact notes

GET
​/contacts​/{contactid}​/notes​/{id}
Retrieve a single contact note

PUT
​/contacts​/{contactid}​/notes​/{id}
Update a contact note

DELETE
​/contacts​/{contactid}​/notes​/{id}
Delete a contact note

GET
​/contacts​/{id}​/categories
Retrieve a list of categories to which this contact belongs

PUT
​/contacts​/{id}​/categories
Update the categories to which this contact belongs

POST
​/contacts​/{id}​/categories
Attach one or more categories to this contact

PUT
​/contacts​/{id}​/categories​/remove
Remove categories from this contact

GET
​/contacts​/{id}​/custom
Retrieve a list of custom fields for this contact

PUT
​/contacts​/{id}​/custom
Update the custom fields for this contact

GET
​/contacts​/{id}​/files
Retrieve a list of files attached to this contact

POST
​/contacts​/{id}​/files
Attach a file to this contact

POST
​/contacts​/{id}​/files​/upload
Attach a file to this contact

GET
​/contacts​/{contactid}​/files​/{id}
Retrieve a single file attached to this contact

DELETE
​/contacts​/{contactid}​/files​/{id}
Delete a file attached to this contact

GET
​/contacts​/{id}​/events
Retrieve a list of calendar events attached to this contact

PUT
​/contacts​/{id}​/touch
Mark the contact record as touched

GET
​/contacts​/{id}​/requirements
Retrieve a list of buying/renting requirements for this contact

POST
​/contacts​/{id}​/requirements
Add a requirement for this contact

GET
​/contacts​/{contactid}​/requirements​/{id}
Retrieve a single buying/renting requirement for this contact

PUT
​/contacts​/{contactid}​/requirements​/{id}
Update a requirement for this contact

DELETE
​/contacts​/{contactid}​/requirements​/{id}
Delete a buying/renting requirement for the contact

GET
​/properties​/{id}​/sale​/{lifeid}​/owners
Retrieve a list of owners attached to this property life

PUT
​/properties​/{id}​/sale​/{lifeid}​/owners
Update owners for this property life

POST
​/properties​/{id}​/sale​/{lifeid}​/owners
Attach an owner to this property life

DELETE
​/properties​/{propertyid}​/lease​/{lifeid}​/landlords​/{id}
Remove a landlord from this property life

DELETE
​/properties​/{propertyid}​/lease​/{lifeid}​/tenancy​/{tenancyid}​/tenants​/{id}
Remove a tenant from this property life

DELETE
​/properties​/{propertyid}​/sale​/{lifeid}​/owners​/{id}
Remove an owner from this property life

DELETE
​/properties​/{propertyid}​/sale​/{lifeid}​/purchasers​/{id}
Remove a purchaser from this property life

GET
​/properties​/{id}​/lease​/{lifeid}​/landlords
Retrieve a list of landlords attached to this property life

PUT
​/properties​/{id}​/lease​/{lifeid}​/landlords
Update landlords for this property life

POST
​/properties​/{id}​/lease​/{lifeid}​/landlords
Attach a landlord to this property life

GET
​/properties​/{id}​/sale​/{lifeid}​/purchasers
Retrieve a list of purchasers attached to this property life

PUT
​/properties​/{id}​/sale​/{lifeid}​/purchasers
Update purchasers for this property life

POST
​/properties​/{id}​/sale​/{lifeid}​/purchasers
Attach a purchaser to this property life

GET
​/properties​/{id}​/lease​/{lifeid}​/tenancy​/{tenancyid}​/tenants
Retrieve a list of tenants attached to this tenancy

PUT
​/properties​/{id}​/lease​/{lifeid}​/tenancy​/{tenancyid}​/tenants
Update tenants for this tenancy

POST
​/properties​/{id}​/lease​/{lifeid}​/tenancy​/{tenancyid}​/tenants
Attach a tenant to this tenancy

GET
​/contacts​/requirements
Retrieve a list of buying/renting requirements across all contacts

GET
​/contacts​/marketingUsers
Retrieve a list of contact marketing users across all contacts

GET
​/contacts​/currentTenants
Retrieve a list of current tenants across all properties

GET
​/contacts​/currentLandlords
Retrieve a list of current landlords across all properties

GET
​/contacts​/currentOwners
Retrieve a list of current owners/vendors across all sale properties

GET
​/contacts​/currentPurchasers
Retrieve a list of current purchasers across all sale properties

GET
​/contacts​/sourceOfEnquiry
Retrieve a list of contact source of enquiry across all contacts

GET
​/contacts​/dates
Retrieve a list of contact dates across all contacts

GET
​/contacts​/categories
Retrieve a list of contact category mappings across all contacts

POST
​/contacts​/{id}​/access
Allow a user to access this contact

GET
​/contacts​/{id}​/activityLog
Retrieve the activity log for a contact

GET
​/contacts​/{contactid}​/bankAccounts​/default
Retrieve the default bank account for this contact

PUT
​/contacts​/{contactid}​/bankAccounts​/default
Update the contact's default bank account

DELETE
​/contacts​/{contactid}​/bankAccounts​/default
Delete the default bank account for this contact

GET
​/contacts​/{contactid}​/dates
Retrieve a list of dates for this contact

GET
​/contacts​/{contactid}​/merged
Retrieve a list of contact ID's merged to this contact

POST
​/contacts​/matchingRequirement​/count
Get a count of contacts matching the provided buy/lease requirement

precincts
Operations related to precincts


GET
​/precincts
Retrieve a list of precincts for this account

GET
​/precincts​/{id}
Retrieve a single precinct

user
Operations related to users


GET
​/user
Retrieve information about the authenticated user

PUT
​/user
Update the authenticated user

GET
​/user​/subscriptions
Retrieve active subscriptions for the authenticated user

GET
​/user​/teams
Retrieve a list of teams to which the authenticated user belongs

GET
​/user​/summary​/grossCommission
Retrieve a summary of recent gross commission for the authenticated user

GET
​/user​/upcomingOfferConditions
Retrieve a list of upcoming offer conditions for the authenticated user

GET
​/user​/upcomingOpenHomes
Retrieve a list of upcoming open homes for the authenticated user

GET
​/user​/tenancyInspections
Retrieve a list of upcoming and recent inspections for the authenticated user

PUT
​/user​/credentials
Update the credentials for the authenticated user

GET
​/user​/signature
Retrieve the authenticated user's signature

PUT
​/user​/signature
Update the signature for the authenticated user

GET
​/user​/photo
Retrieve the authenticated user's photograph

PUT
​/user​/photo
Update the photo for the authenticated user

GET
​/account
Retrieve information about the authenticated account

GET
​/account​/users
Retrieve a list of users in the authenticated account

POST
​/account​/users
Add a new user in the authenticated account

GET
​/account​/users​/{id}
Retrieve a single user from the account

PUT
​/account​/users​/{id}
Update a user in the authenticated account

DELETE
​/account​/users​/{id}
Delete a user in the authenticated account

GET
​/account​/users​/{id}​/teams
Retrieve a list of teams to which this user belongs

GET
​/account​/teams
Retrieve a list of teams in the authenticated account

GET
​/account​/teams​/{id}
Retrieve a single team from the account

GET
​/account​/enquirySources
Retrieve a list of enquiry sources in the authenticated account

POST
​/account​/enquirySources
Add a new Enquiry Source type

GET
​/account​/enquirySources​/{id}
Retrieve a single enquiry source

PUT
​/account​/enquirySources​/{id}
Update an Enquiry Source type

GET
​/account​/pricing
Retrieve pricing information for the authenticated account

GET
​/account​/upcomingOpenHomes
Retrieve a list of upcoming open homes for the authenticated account

GET
​/account​/folders​/filingCabinet
Retrieve a list of folders available in the Filing Cabinet for this account

GET
​/account​/branches
Retrieve a list of branches configured for this account

GET
​/account​/propertyPortals
Retrieve a list of property portals for this account

GET
​/account​/trustAccounts
Retrieve a list of trust accounts for this account

POST
​/verifyPassword
Verify the authenticated user's password

GET
​/sso
Generate a single-sign-on URL

GET
​/account​/contactDateTypes
Retrieve a list of available contact date types for this account

GET
​/user​/oAuthLoginUrl
Get the oAuth sign-in target URL for this username

GET
​/account​/oAuthLoginUrl
Get the oAuth sign-in target URL for this username (office level oAuth exchange)

GET
​/account​/customRegions
Retrieve a list of custom regions for this account

properties
Operations related to properties


GET
​/properties
Retrieve a list of properties

GET
​/properties​/{id}
Retrieve a single property

DELETE
​/properties​/{id}
Delete a property

GET
​/properties​/sale
Retrieve a list of sale properties

GET
​/properties​/sale​/fallenSaleWithdrawn
Retrieve a list of fallen or withdrawn property sales

GET
​/properties​/lease
Retrieve a list of lease properties

GET
​/properties​/{id}​/notes
Retrieve a list of notes attached to this property

POST
​/properties​/{id}​/notes
Add a note to this property

GET
​/properties​/{propertyid}​/notes​/{id}
Retrieve a single property note

PUT
​/properties​/{propertyid}​/notes​/{id}
Update a property note

DELETE
​/properties​/{propertyid}​/notes​/{id}
Delete a property note

GET
​/properties​/{id}​/photos
Retrieve a list of photos for this property

POST
​/properties​/{id}​/photos
Upload a new photo to this property

POST
​/properties​/{id}​/photos​/upload
Upload a new photo to this property

GET
​/properties​/{propertyid}​/photos​/{id}
Retrieve a single photo for this property

DELETE
​/properties​/{propertyid}​/photos​/{id}
Delete a photo attached to this property

GET
​/properties​/{propertyid}​/photos​/{id}​/tags
Retrieve a list of tags for this property photo

GET
​/properties​/{id}​/tags
Retrieve a list of tags for this property

GET
​/properties​/{id}​/categories
Retrieve a list of categories to which this property belongs

GET
​/properties​/{id}​/activityLog
Retrieve the activity log for a property

POST
​/properties​/{id}​/activityLog
Add a property activity note

GET
​/properties​/{id}​/files
Retrieve a list of files attached to this property

GET
​/properties​/{id}​/{salelease}​/{lifeid}​/matchingContacts
Retrieve a list of contacts with requirements matching this property

GET
​/properties​/{id}​/{salelease}​/{lifeid}​/files
Retrieve a list of files attached to this property life

POST
​/properties​/{id}​/{salelease}​/{lifeid}​/files
Attach a file to this property life

POST
​/properties​/{id}​/{salelease}​/{lifeid}​/files​/upload
Attach a file to this property life

GET
​/properties​/{propertyid}​/{salelease}​/{lifeid}​/files​/{id}
Retrieve a single file attached to this property life

DELETE
​/properties​/{propertyid}​/{salelease}​/{lifeid}​/files​/{id}
Delete a single file attached to this property life

GET
​/properties​/{id}​/{salelease}​/{lifeid}​/feedback
Retrieve a list of property feedback attached to this life

POST
​/properties​/{id}​/{salelease}​/{lifeid}​/feedback
Attach feedback to this property life

GET
​/properties​/{propertyid}​/{salelease}​/{lifeid}​/feedback​/{id}
Retrieve a property feedback item attached to this life

PUT
​/properties​/{propertyid}​/{salelease}​/{lifeid}​/feedback​/{id}
Update a feedback item

DELETE
​/properties​/{propertyid}​/{salelease}​/{lifeid}​/feedback​/{id}
Delete a property feedback item

GET
​/properties​/{id}​/{salelease}​/{lifeid}​/feedback​/summary
Retrieve a summary of property feedback feedback attached to this life

GET
​/properties​/{id}​/{salelease}​/{lifeid}​/openHomes
Retrieve a list of open homes attached to this life

POST
​/properties​/{id}​/{salelease}​/{lifeid}​/openHomes
Create a new open home for this property life

GET
​/properties​/{propertyid}​/{salelease}​/{lifeid}​/openHomes​/{id}
Retrieve a single open home attached to this life

PUT
​/properties​/{propertyid}​/{salelease}​/{lifeid}​/openHomes​/{id}
Update an open home for this property life

DELETE
​/properties​/{propertyid}​/{salelease}​/{lifeid}​/openHomes​/{id}
Delete an open home

GET
​/properties​/{id}​/sale​/{lifeid}​/owners
Retrieve a list of owners attached to this property life

PUT
​/properties​/{id}​/sale​/{lifeid}​/owners
Update owners for this property life

POST
​/properties​/{id}​/sale​/{lifeid}​/owners
Attach an owner to this property life

DELETE
​/properties​/{propertyid}​/lease​/{lifeid}​/landlords​/{id}
Remove a landlord from this property life

DELETE
​/properties​/{propertyid}​/lease​/{lifeid}​/tenancy​/{tenancyid}​/tenants​/{id}
Remove a tenant from this property life

DELETE
​/properties​/{propertyid}​/sale​/{lifeid}​/owners​/{id}
Remove an owner from this property life

DELETE
​/properties​/{propertyid}​/sale​/{lifeid}​/purchasers​/{id}
Remove a purchaser from this property life

GET
​/properties​/{id}​/lease​/{lifeid}​/landlords
Retrieve a list of landlords attached to this property life

PUT
​/properties​/{id}​/lease​/{lifeid}​/landlords
Update landlords for this property life

POST
​/properties​/{id}​/lease​/{lifeid}​/landlords
Attach a landlord to this property life

GET
​/properties​/{id}​/sale​/{lifeid}​/purchasers
Retrieve a list of purchasers attached to this property life

PUT
​/properties​/{id}​/sale​/{lifeid}​/purchasers
Update purchasers for this property life

POST
​/properties​/{id}​/sale​/{lifeid}​/purchasers
Attach a purchaser to this property life

GET
​/properties​/{id}​/lease​/{lifeid}​/tenancy​/{tenancyid}​/tenants
Retrieve a list of tenants attached to this tenancy

PUT
​/properties​/{id}​/lease​/{lifeid}​/tenancy​/{tenancyid}​/tenants
Update tenants for this tenancy

POST
​/properties​/{id}​/lease​/{lifeid}​/tenancy​/{tenancyid}​/tenants
Attach a tenant to this tenancy

GET
​/properties​/{id}​/features
Retrieve features for this property

PUT
​/properties​/{id}​/features
Update features for this property

GET
​/properties​/{class}​/{salelease}​/{id}​/custom
Retrieve a list of custom fields for a given property

PUT
​/properties​/{class}​/{salelease}​/{id}​/custom
Update the custom fields for this property

GET
​/properties​/{id}​/sale​/{lifeid}​/offerConditions
Retrieve a list of offer conditions for this property life

GET
​/properties​/{propertyid}​/sale​/{lifeid}​/offerConditions​/{id}
Retrieve an offer condition for this property life

PUT
​/properties​/{propertyid}​/sale​/{lifeid}​/offerConditions​/{id}
Update a property's offer condition

PUT
​/properties​/{propertyid}​/sale​/{lifeid}​/offerConditions​/{id}​/complete
Complete a property's offer condition

PUT
​/properties​/{propertyid}​/sale​/{lifeid}​/offerConditions​/{id}​/uncomplete
Uncomplete a property's offer condition

GET
​/properties​/{class}​/{salelease}​/upcomingOpenHomes
Retrieve a list of upcoming open homes

GET
​/properties​/lookup​/{propertyReference}
Look up property information based on property reference

PUT
​/properties​/{id}​/sale​/statusChange​/listing
Convert a prospect or appraisal sale property to listing status

PUT
​/properties​/{id}​/lease​/statusChange​/management
Convert a prospect or appraisal lease property to management status

GET
​/properties​/{id}​/{salelease}​/{lifeid}​/interest
Retrieve a list of contacts and their interest related this property life

GET
​/properties​/{id}​/{salelease}​/{lifeid}​/interest​/{contactid}
Retrieve a single contact's interest in this property life

PUT
​/properties​/{id}​/{salelease}​/{lifeid}​/interest​/{contactid}
Update a contact's interest in this property life

GET
​/properties​/{id}​/{salelease}​/{lifeid}​/enquirySources
Retrieve a list of contacts and their source of enquiry related this property life

GET
​/properties​/{id}​/{salelease}​/{lifeid}​/enquirySources​/{contactid}
Retrieve a single contact's source of enquiry for this property life

PUT
​/properties​/{id}​/{salelease}​/{lifeid}​/enquirySources​/{contactid}
Update a contact's source of enquiry for this property life

GET
​/contacts​/currentTenants
Retrieve a list of current tenants across all properties

GET
​/contacts​/currentLandlords
Retrieve a list of current landlords across all properties

GET
​/contacts​/currentOwners
Retrieve a list of current owners/vendors across all sale properties

GET
​/contacts​/currentPurchasers
Retrieve a list of current purchasers across all sale properties

GET
​/properties​/{propertyid}​/lease​/{lifeid}​/maintenance
Retrieve a list of maintenance jobs for this property life

POST
​/properties​/{propertyid}​/lease​/{lifeid}​/maintenance
Create a maintenance job

GET
​/properties​/{propertyid}​/lease​/{lifeid}​/maintenance​/{jobid}
Retrieve a single maintenance job

PUT
​/properties​/{propertyid}​/lease​/{lifeid}​/maintenance​/{jobid}
Update a single maintenance job

DELETE
​/properties​/{propertyid}​/lease​/{lifeid}​/maintenance​/{jobid}
Delete a maintenance job

POST
​/properties​/{propertyid}​/lease​/{lifeid}​/maintenance​/{jobid}​/photos
Add a maintenance job photo

GET
​/properties​/{propertyid}​/lease​/{lifeid}​/maintenance​/{jobid}​/photos​/{id}
Retrieve a single maintenance job photo

DELETE
​/properties​/{propertyid}​/lease​/{lifeid}​/maintenance​/{jobid}​/photos​/{id}
Delete a maintenance job photo

GET
​/properties​/{propertyid}​/lease​/{lifeid}​/maintenance​/{jobid}​/requests
Retrieve a list of requests for a maintenance job

POST
​/properties​/{propertyid}​/lease​/{lifeid}​/maintenance​/{jobid}​/requests
Create a maintenance job request

PUT
​/properties​/{propertyid}​/lease​/{lifeid}​/maintenance​/{jobid}​/requests​/{id}​/initiateWorkOrder
Initiate a maintenance work order

PUT
​/properties​/{propertyid}​/lease​/{lifeid}​/maintenance​/{jobid}​/requests​/{id}​/complete
Complete a maintenance work order

GET
​/properties​/{propertyid}​/lease​/{lifeid}​/maintenance​/{jobid}​/notes
Retrieve a list of notes for a maintenance job

GET
​/properties​/{propertyid}​/lease​/{lifeid}​/tenancy​/{id}​/inspections
Retrieve a list of inspections for a tenancy

POST
​/properties​/{propertyid}​/lease​/{lifeid}​/tenancy​/{id}​/inspections
Create an inspection

GET
​/properties​/{propertyid}​/lease​/{lifeid}​/tenancy​/{tenancyid}​/inspections​/{id}
Retrieve a single inspection for a tenancy

PUT
​/properties​/{propertyid}​/lease​/{lifeid}​/tenancy​/{tenancyid}​/inspections​/{id}
Update an inspection

DELETE
​/properties​/{propertyid}​/lease​/{lifeid}​/tenancy​/{tenancyid}​/inspections​/{id}
Delete an inspection

PUT
​/property​/flush
Trigger a property to be re-sent to certain portal sites

GET
​/properties​/{propertyid}​/saleHistory
Retrieve the full sale history for a property

POST
​/properties​/{propertyid}​/{salelease}​/{lifeid}​/scheduledViewing
Add a Scheduled Viewing
GET
​/properties​/{propertyid}​/{salelease}​/{lifeid}​/scheduledViewing
Retrieve a list of scheduled viewings for this life

GET
​/properties​/categories
Retrieve a list of property category mappings across all properties

GET
​/properties​/{propertyid}​/keys
Retrieve a list of keys for this property

POST
​/properties​/{propertyid}​/keys
Add a new key to this property

GET
​/properties​/{propertyid}​/keys​/{id}
Retrieve a key from this property

PUT
​/properties​/{propertyid}​/keys​/{id}
Update a property key

GET
​/properties​/{id}​/{salelease}​/{lifeid}​/portals
Retrieve a list of portal sites to which this listing is published

GET
​/properties​/{id}​/{salelease}​/{lifeid}​/portalIds
Retrieve a list of property portal IDs

GET
​/properties​/{propertyid}​/alarmDetails
Retrieve a list of alarm details for a property

GET
​/properties​/{propertyid}​/{salelease}​/alarmDetails
Retrieve a list of alarm details for a property life

GET
​/properties​/{id}​/{salelease}​/{lifeid}​/rooms
Retrieve a list of rooms defined for this property life

GET
​/properties​/{id}​/sale​/{lifeid}​/solicitors
Retrieve purchaser and vendor solicitors defined for this property life

GET
​/properties​/externalRefs​/lookup
Retrieve properties from an external reference

GET
​/properties​/{propertyid}​/listingConfigurations
Retrieve a list of listing configurations for the given property

GET
​/properties​/{propertyid}​/strataProperties
Retrieve a list of strata properties for the given property

GET
​/properties​/{propertyid}​/projectProperties
Retrieve a list of project properties for the given property

GET
​/properties​/{propertyid}​/{salelease}​/{lifeid}​/qrcode
Retrieve a check-in QR code for the given property life

GET
​/properties​/{propertyid}​/{salelease}​/{lifeid}​/hazards
Retrieve a list of hazards for a given property life

GET
​/properties​/{propertyid}​/{salelease}​/{lifeid}​/externalFeedback​/{id}
Retrieve a signle external feedback for a given property life

GET
​/properties​/{propertyid}​/{salelease}​/{lifeid}​/externalFeedback
Retrieve a list of external feedback for a given property life

POST
​/properties​/{propertyid}​/{salelease}​/{lifeid}​/externalFeedback
Add an External Feedback
conjunctionals
Operations related to conjunctional property deals


GET
​/conjunctionals
Retrieve a list of conjunctional property deals for this account

openhomes
Operations related to open homes


GET
​/openHomes
Retrieve a list of property open homes

propertyOfferConditions
Operations related to property offer conditions


GET
​/properties​/{id}​/sale​/{lifeid}​/offerConditions
Retrieve a list of offer conditions for this property life

GET
​/properties​/{propertyid}​/sale​/{lifeid}​/offerConditions​/{id}
Retrieve an offer condition for this property life

PUT
​/properties​/{propertyid}​/sale​/{lifeid}​/offerConditions​/{id}
Update a property's offer condition

PUT
​/properties​/{propertyid}​/sale​/{lifeid}​/offerConditions​/{id}​/complete
Complete a property's offer condition

PUT
​/properties​/{propertyid}​/sale​/{lifeid}​/offerConditions​/{id}​/uncomplete
Uncomplete a property's offer condition

propertyOffer
Operations related to property offers


GET
​/propertyOffers
Retrieve a list of property offers for this account

POST
​/propertyOffers
Add a property offer

GET
​/propertyOffers​/{id}
Retrieve a single property offer

PUT
​/propertyOffers​/{id}
Update a property offer

feedback
Operations related to property feedback


GET
​/properties​/{id}​/{salelease}​/{lifeid}​/feedback
Retrieve a list of property feedback attached to this life

POST
​/properties​/{id}​/{salelease}​/{lifeid}​/feedback
Attach feedback to this property life

GET
​/properties​/{propertyid}​/{salelease}​/{lifeid}​/feedback​/{id}
Retrieve a property feedback item attached to this life

PUT
​/properties​/{propertyid}​/{salelease}​/{lifeid}​/feedback​/{id}
Update a feedback item

DELETE
​/properties​/{propertyid}​/{salelease}​/{lifeid}​/feedback​/{id}
Delete a property feedback item

GET
​/properties​/{id}​/{salelease}​/{lifeid}​/feedback​/summary
Retrieve a summary of property feedback feedback attached to this life

residentialProperties
Operations related to residential properties


GET
​/properties​/residential​/sale
Retrieve a list of residential sale properties

POST
​/properties​/residential​/sale
Add a residential sale property

GET
​/properties​/residential​/sale​/available
Retrieve a list of available residential sale properties

GET
​/properties​/residential​/sale​/{id}
Retrieve a single residential sale property

PUT
​/properties​/residential​/sale​/{id}
Update a residential sale property

GET
​/properties​/residential​/sale​/sold
Retrieve a list of sold residential sale properties

GET
​/properties​/residential​/lease
Retrieve a list of residential lease properties

POST
​/properties​/residential​/lease
Add a residential lease property

GET
​/properties​/residential​/lease​/available
Retrieve a list of available residential lease properties

GET
​/properties​/residential​/lease​/{id}
Retrieve a single residential lease property

PUT
​/properties​/residential​/lease​/{id}
Update a residential lease property

GET
​/properties​/residential​/sale​/{id}​/{lifeid}
Retrieve a single residential sale property

GET
​/properties​/residential​/lease​/{id}​/{lifeid}
Retrieve a single residential lease property

ruralProperties
Operations related to rural properties


GET
​/properties​/rural​/sale
Retrieve a list of rural properties

POST
​/properties​/rural​/sale
Add a rural property

GET
​/properties​/rural​/sale​/available
Retrieve a list of available rural properties

GET
​/properties​/rural​/sale​/{id}
Retrieve a single rural property

PUT
​/properties​/rural​/sale​/{id}
Update a rural property

GET
​/properties​/rural​/sale​/sold
Retrieve a list of sold rural properties

GET
​/properties​/rural​/sale​/{id}​/{lifeid}
Retrieve a single rural property

GET
​/properties​/business​/sale​/{id}​/{lifeid}
Retrieve a single rural property

GET
​/properties​/livestock​/sale​/{id}​/{lifeid}
Retrieve a single rural property

GET
​/properties​/clearingSales​/sale​/{id}​/{lifeid}
Retrieve a single rural property

GET
​/properties​/holidayRental​/lease​/{id}​/{lifeid}
Retrieve a single rural property

commercialProperties
Operations related to commercial properties


GET
​/properties​/commercial​/sale
Retrieve a list of commercial sale properties

POST
​/properties​/commercial​/sale
Add a commercial sale property

GET
​/properties​/commercial​/sale​/available
Retrieve a list of available commercial sale properties

GET
​/properties​/commercial​/sale​/{id}
Retrieve a single commercial sale property

PUT
​/properties​/commercial​/sale​/{id}
Update a commercial sale property

GET
​/properties​/commercial​/sale​/sold
Retrieve a list of sold commercial properties

GET
​/properties​/commercial​/lease​/leased
Retrieve a list of leased commercial properties

GET
​/properties​/commercial​/lease
Retrieve a list of commercial lease properties

POST
​/properties​/commercial​/lease
Add a commercial lease property

GET
​/properties​/commercial​/lease​/available
Retrieve a list of available commercial lease properties

GET
​/properties​/commercial​/lease​/{id}
Retrieve a single commercial lease property

PUT
​/properties​/commercial​/lease​/{id}
Update a commercial lease property

GET
​/properties​/commercial​/sale​/{id}​/{lifeid}
Retrieve a single commercial property

businessProperties
Operations related to business properties


GET
​/properties​/business​/sale
Retrieve a list of business properties

POST
​/properties​/business​/sale
Add a business property

GET
​/properties​/business​/sale​/available
Retrieve a list of available business properties

GET
​/properties​/business​/sale​/{id}
Retrieve a single business property

PUT
​/properties​/business​/sale​/{id}
Update a business property

GET
​/properties​/business​/sale​/sold
Retrieve a list of sold business properties

landProperties
Operations related to land properties


GET
​/properties​/land​/sale
Retrieve a list of land properties

POST
​/properties​/land​/sale
Add a land property

GET
​/properties​/land​/sale​/available
Retrieve a list of available land properties

GET
​/properties​/land​/sale​/{id}
Retrieve a single land property

PUT
​/properties​/land​/sale​/{id}
Update a land property

GET
​/properties​/land​/sale​/sold
Retrieve a list of sold land properties

GET
​/properties​/land​/sale​/{id}​/{lifeid}
Retrieve a single land property

holidayRentalProperties
Operations related to holiday rental properties


GET
​/properties​/holidayRental​/lease
Retrieve a list of holiday rental properties

POST
​/properties​/holidayRental​/lease
Add a holiday rental property

GET
​/properties​/holidayRental​/lease​/available
Retrieve a list of available holiday rental properties

GET
​/properties​/holidayRental​/lease​/{id}
Retrieve a single holiday rental property

PUT
​/properties​/holidayRental​/lease​/{id}
Update a holiday rental property

livestockProperties
Operations related to livestock properties


GET
​/properties​/livestock​/sale​/sold
Retrieve a list of sold livestock properties

GET
​/properties​/livestock​/sale
Retrieve a list of livestock properties

POST
​/properties​/livestock​/sale
Add a livestock property

GET
​/properties​/livestock​/sale​/{id}
Retrieve a single livestock property

PUT
​/properties​/livestock​/sale​/{id}
Update a livestock property

clearingSalesProperties
Operations related to clearing sales properties


GET
​/properties​/clearingSales​/sale​/sold
Retrieve a list of sold clearing sales properties

GET
​/properties​/clearingSales​/sale
Retrieve a list of clearing sales properties

POST
​/properties​/clearingSales​/sale
Add a clearing sales property

GET
​/properties​/clearingSales​/sale​/{id}
Retrieve a single clearing sales property

PUT
​/properties​/clearingSales​/sale​/{id}
Update a clearing sales property

search
Operations related to performing searches


GET
​/search​/properties​/address
Search for properties by address

GET
​/search​/contacts
Search for contacts by a variety of criteria

GET
​/search​/contacts​/name
Search for contacts by name

GET
​/search​/contacts​/phone
Search for contacts by phone number (exact match)

GET
​/search​/contacts​/email
Search for contacts by email address (exact match)

GET
​/search​/buildings​/name
Search for buildings by name

GET
​/search​/contactCategories​/name
Search for contact categories by name

GET
​/search​/threads​/recipients
Get all threads with the supplied recipients

GET
​/search​/threads​/staffTypes
Get all threads with the supplied recipients

GET
​/search​/threads​/term
Search for message threads containing term

suggest
Operations related to suggest services


GET
​/suggest​/suburb
Search for a suburb

GET
​/suggest​/district
Search for a district

GET
​/suggest​/address​/corelogic
Search for an address in CoreLogic

buildings
Operations related to buildings


GET
​/buildings
Retrieve a list of buildings

POST
​/buildings
Create a building record

GET
​/buildings​/{id}
Retrieve a single building

PUT
​/buildings​/{id}
Update the building

DELETE
​/buildings​/{id}
Delete the building

calendar
Operations related to calendar events


GET
​/contacts​/{id}​/events
Retrieve a list of calendar events attached to this contact

GET
​/calendar​/events
Get a list of calendar events for the user or account

POST
​/calendar​/events
Add a calendar event

GET
​/calendar​/events​/{id}
Get a single calendar event

PUT
​/calendar​/events​/{id}
Update a calendar event

DELETE
​/calendar​/events​/{id}
Delete a calendar event

tasks
Operations related to tasks


GET
​/tasks
Get a list of tasks for the account or user

POST
​/tasks
Add a task

GET
​/tasks​/{id}
Get a single task

PUT
​/tasks​/{id}
Update a task

DELETE
​/tasks​/{id}
Delete a task

PUT
​/tasks​/{id}​/complete
Mark the task as completed

PUT
​/tasks​/{id}​/uncomplete
Mark the task as incomplete

corelogic
Operations related to CoreLogic


GET
​/suggest​/address​/corelogic
Search for an address in CoreLogic

GET
​/corelogic​/properties​/{id}
Retrieve a property from CoreLogic

GET
​/corelogic​/properties​/{id}​/avm
Retrieve an AVM estimate for this CoreLogic property

GET
​/corelogic​/properties​/{id}​/rentalavm
Retrieve a rental AVM estimate for this CoreLogic property

GET
​/corelogic​/disclaimers
Retrieve CoreLogic disclaimers

reinz
Operations related to REINZ


GET
​/reinz​/sales
Retrieve a list of sales sent to REINZ

types
Operations related to various VaultRE object types


GET
​/responseCodes
Retrieve a list of response codes used in this API

GET
​/types​/propertyClass
Retrieve a list of property classes

GET
​/types​/propertyType
Retrieve a list of property types

GET
​/types​/customUnsubscribe
Retrieve a list of custom unsubscribe types

GET
​/types​/contactInterest
Retrieve a list of contact interest types

GET
​/types​/entityTypes
Retrieve a list of contact entity types

GET
​/types​/externalLinks
Retrieve a list of property external link types

GET
​/types​/contactnotes
Retrieve a list of contact note types for this account

GET
​/types​/contactnotes​/{id}
Retrieve a single contact note type

GET
​/types​/propertynotes
Retrieve a list of property note types for this account

GET
​/types​/propertynotes​/{id}
Retrieve a single property note type

GET
​/types​/priceQualifiers
Retrieve a list of price qualifier types

GET
​/types​/tenureOrTitleTypes
Retrieve a list of tenure or title types

GET
​/types​/holdingArea
Retrieve a list of holding area types

GET
​/types​/methodOfSale
Retrieve a list of method of sale types

GET
​/types​/auctionSale
Retrieve a list of Auction types

GET
​/types​/advertising​/transactions
Retrieve a list of advertising transaction types

GET
​/types​/advertising​/payments
Retrieve a list of advertising payment types

enquiries
Operations related to listing enquiries


GET
​/enquiries​/{id}
Retrieve a single enquiry from the holding area

GET
​/enquiries
Get a list of enquiries from the holding area

POST
​/enquiries
Submit a listing or agent enquiry

GET
​/types​/holdingArea
Retrieve a list of holding area types

fmsleads
Operations related to FMS leads


GET
​/fms​/leads
Get a list of FMS leads

POST
​/fms​/leads
Submit a new FMS lead

propertyStats
Operations related to property portal stats


PUT
​/property​/portalStats​/cumulative
Update cumulative portal stats for a property

PUT
​/property​/portalStats​/total
Update total portal stats for a property

GET
​/property​/portalStats
Retrieve previously submitted portal stats for a given property and portal

integrator
Special endpoints for access by integrating partners


GET
​/integrator​/accounts
Retrieve a list of accounts linked to this integrator

GET
​/integrator​/accounts​/{id}
Retrieve an account linked to this integrator

GET
​/integrator​/accounts​/{id}​/users
Retrieve a list of users for this account

GET
​/integrator​/accounts​/{accountid}​/users​/{id}
Retrieve a user for this account

GET
​/integrator​/scopes
Retrieve a list of possible scopes for your API key

GET
​/integrator​/tokens
Retrieve a list of bearer tokens, with accounts, linked to this integrator

POST
​/integrator​/validateUser
Validate a user's credentials

PUT
​/properties​/{propertyid}​/{salelease}​/{lifeid}​/externalStats
Integrator property statistics

POST
​/properties​/{propertyid}​/{salelease}​/{lifeid}​/externalStats
Integrator property statistics

GET
​/scopes
Retrieve a list of granted scopes for this bearer token

GET
​/integrator​/usage
Retrieve daily quota for this API key

sms
Operations related to SMS


POST
​/contacts​/{id}​/sms
Send an SMS to this contact

POST
​/contacts​/sms
Send multiple SMS messages to contacts

email
Operations related to email


POST
​/contacts​/{id}​/email
Send an email to this contact

POST
​/contacts​/email
Send multiple emails to contacts

templates
Operations related to SMS and email templates


GET
​/templates​/email
Retrieve a list of email templates

POST
​/templates​/email
Create an email template

GET
​/templates​/email​/{id}
Retrieve a single email template

PUT
​/templates​/email​/{id}
Update an email template

GET
​/templates​/sms
Retrieve a list of SMS templates

POST
​/templates​/sms
Create an SMS template

GET
​/templates​/sms​/{id}
Retrieve a single SMS template

PUT
​/templates​/sms​/{id}
Update an SMS template

GET
​/templates​/ownerSummary
Retrieve a list of owner summary templates

POST
​/templates​/ownerSummary
Create an Owner Summary template

GET
​/templates​/ownerSummary​/{id}
Retrieve a single Owner Summary template

PUT
​/templates​/ownerSummary​/{id}
Update an Owner Summary template

maintenance
Operations related to maintenance jobs


GET
​/maintenance
Retrieve a list of all maintenance jobs for this account

GET
​/properties​/{propertyid}​/lease​/{lifeid}​/maintenance
Retrieve a list of maintenance jobs for this property life

POST
​/properties​/{propertyid}​/lease​/{lifeid}​/maintenance
Create a maintenance job

GET
​/properties​/{propertyid}​/lease​/{lifeid}​/maintenance​/{jobid}
Retrieve a single maintenance job

PUT
​/properties​/{propertyid}​/lease​/{lifeid}​/maintenance​/{jobid}
Update a single maintenance job

DELETE
​/properties​/{propertyid}​/lease​/{lifeid}​/maintenance​/{jobid}
Delete a maintenance job

POST
​/properties​/{propertyid}​/lease​/{lifeid}​/maintenance​/{jobid}​/photos
Add a maintenance job photo

GET
​/properties​/{propertyid}​/lease​/{lifeid}​/maintenance​/{jobid}​/photos​/{id}
Retrieve a single maintenance job photo

DELETE
​/properties​/{propertyid}​/lease​/{lifeid}​/maintenance​/{jobid}​/photos​/{id}
Delete a maintenance job photo

GET
​/properties​/{propertyid}​/lease​/{lifeid}​/maintenance​/{jobid}​/requests
Retrieve a list of requests for a maintenance job

POST
​/properties​/{propertyid}​/lease​/{lifeid}​/maintenance​/{jobid}​/requests
Create a maintenance job request

PUT
​/properties​/{propertyid}​/lease​/{lifeid}​/maintenance​/{jobid}​/requests​/{id}​/initiateWorkOrder
Initiate a maintenance work order

PUT
​/properties​/{propertyid}​/lease​/{lifeid}​/maintenance​/{jobid}​/requests​/{id}​/complete
Complete a maintenance work order

GET
​/properties​/{propertyid}​/lease​/{lifeid}​/maintenance​/{jobid}​/notes
Retrieve a list of notes for a maintenance job

inspections
Operations related to inspections


GET
​/properties​/{propertyid}​/lease​/{lifeid}​/tenancy​/{id}​/inspections
Retrieve a list of inspections for a tenancy

POST
​/properties​/{propertyid}​/lease​/{lifeid}​/tenancy​/{id}​/inspections
Create an inspection

GET
​/properties​/{propertyid}​/lease​/{lifeid}​/tenancy​/{tenancyid}​/inspections​/{id}
Retrieve a single inspection for a tenancy

PUT
​/properties​/{propertyid}​/lease​/{lifeid}​/tenancy​/{tenancyid}​/inspections​/{id}
Update an inspection

DELETE
​/properties​/{propertyid}​/lease​/{lifeid}​/tenancy​/{tenancyid}​/inspections​/{id}
Delete an inspection

suppliers
Operations related to creditors / suppliers


GET
​/suppliers
Retrieve a list of suppliers

POST
​/suppliers
Create a supplier

GET
​/suppliers​/{id}
Retrieve a single supplier

PUT
​/suppliers​/{id}
Update a single supplier

DELETE
​/suppliers​/{id}
Delete a supplier

GET
​/suppliers​/{id}​/insurance
Retrieve a supplier's insurance

PUT
​/suppliers​/{id}​/insurance
Update a single supplier's insurance

GET
​/suppliers​/{id}​/categories
Retrieve a list of categories to which this supplier belongs

bulk
Bulk operations


GET
​/bulk​/contactNotes​/requests
Retrieve a list of previously requested exports of contact notes

GET
​/bulk​/contactNotes​/request
Retrieve a previously requested export of contact notes

POST
​/bulk​/contactNotes​/request
Request an export of contact notes

DELETE
​/bulk​/contactNotes​/request
Delete a previously requested export of contact notes

GET
​/bulk​/inspections
Retrieve a list of property inspections

GET
​/bulk​/feedback
Retrieve a list of feedback items

deals
Operations related to commercial deals


GET
​/properties​/{propertyid}​/deals​/sale
Retrieve a list of sale deals for this (commercial) property

POST
​/properties​/{propertyid}​/deals​/sale
Add a commercial sale deal
GET
​/properties​/{propertyid}​/deals​/lease
Retrieve a list of lease deals for this (commercial) property

POST
​/properties​/{propertyid}​/deals​/lease
Add a commercial lease deal
GET
​/properties​/{propertyid}​/deals​/sale​/{dealid}
Retrieve a commercial sale deal

PUT
​/properties​/{propertyid}​/deals​/sale​/{dealid}
Update a commercial sale deal
DELETE
​/properties​/{propertyid}​/deals​/sale​/{dealid}
Delete a commercial sale deal
GET
​/properties​/{propertyid}​/deals​/lease​/{dealid}
Retrieve a commercial lease deal

PUT
​/properties​/{propertyid}​/deals​/lease​/{dealid}
Update a commercial lease deal
DELETE
​/properties​/{propertyid}​/deals​/lease​/{dealid}
Delete a commercial lease deal
GET
​/properties​/deals​/sale
Retrieve a list of commercial sale deals for this account.

GET
​/properties​/deals​/lease
Retrieve a list of commercial lease deals for this account.

suburbs
Operations related to suburbs


GET
​/suburbs
Retrieve a list of suburbs for the user's country

GET
​/account​/customRegions
Retrieve a list of custom regions for this account

messages
Operations related to franchise and user messages


GET
​/messages​/received
Retrieve all received messages

GET
​/messages​/sent
Retrieve all sent messages

GET
​/threads
Retrieve all message threads

POST
​/threads​/franchise
Add a franchise thread

POST
​/threads​/user
Add a user message thread

PUT
​/threads​/{id}
Update a message thread

GET
​/threads​/{id}​/messages
Retrieve all messages in a thread

POST
​/threads​/{id}​/messages
Add a message to a thread

POST
​/threads​/{id}​/markRead
Mark all messages in a thread as read by the current user

GET
​/search​/threads​/recipients
Get all threads with the supplied recipients

GET
​/search​/threads​/staffTypes
Get all threads with the supplied recipients

GET
​/search​/threads​/term
Search for message threads containing term

keys
Operations related to property keys


GET
​/properties​/{propertyid}​/keys
Retrieve a list of keys for this property

POST
​/properties​/{propertyid}​/keys
Add a new key to this property

GET
​/properties​/{propertyid}​/keys​/{id}
Retrieve a key from this property

PUT
​/properties​/{propertyid}​/keys​/{id}
Update a property key

eventStream
Operations related to the event stream


GET
​/eventStream
Poll the event stream

campaigns
Operations related to marketing campaigns


GET
​/campaigns
Retrieve a list of marketing campaigns for this account

GET
​/campaigns​/{id}
Retrieve a single marketing campaign

GET
​/campaigns​/{id}​/tracking
Retrieve a campaign tracking data

GET
​/campaigns​/{id}​/tracking​/summary
Retrieve campaign stats (totals)

tenancies
Operations related to tenancies


GET
​/properties​/residential​/lease​/tenancies
Retrieve a list of residential tenancies

invoices
Operations related to invoices


GET
​/invoices​/saleSummary
Retrieve sale summary

Schemas
AuthToken
TemporaryToken
AccountBranch
MarketingUser
AddUpdateMarketingUser
Contact
ContactExtended
PhoneNumber
Country
Region
District
State
Suburb
RoyalMail
CustomAddress
Address
UpdateAddress
Unsubscribe
Credential
TwoFactorCredential
ID
LocationHeader
SuccessOrError
ResponseCode
Urls
ContactNoteTypePurpose
ContactNoteType
PropertyNoteTypePurpose
PropertyNoteType
Account
MarketingUserOrder
ContactPhoto
UserPhoto
User
UserAndTeams
ContactNote
ContactNoteExtended
ContactNoteAndContact
ContactNoteAndContactExtended
ContactNoteReminder
AddContactNoteReminder
UpdateContactNote
AddUpdatePropertyFeedback
UpdateContactNoteWithFeedback
AddContactNote
AddContactNoteWithFeedback
AddPropertyFeedback
UpdatePropertyFeedback
PropertyNote
UpdatePropertyNote
AddPropertyNote
CategoryGroupingSimple
CategoryGrouping
Category
AddUpdateCategoryGrouping
AddUpdateCategory
Building
AddUpdateBuilding
PropertyPhotoThumbnails
PropertyPhoto
Property
PropertyLife
PropertyExtended
AddUpdateProperty
ResidentialProperty
ResidentialPropertyExtended
AddUpdateResidentialProperty
SaleProperty
AddUpdateSaleProperty
MethodOfSale
AuctionSaleType
SoldType
AuthorityType
ResidentialSaleProperty
ResidentialSoldProperty
ResidentialSalePropertyExtended
ResidentialSoldPropertyExtended
LeaseProperty
AddUpdateLeaseProperty
ResidentialLeaseProperty
ResidentialLeasePropertyExtended
AddUpdateResidentialSaleProperty
AddUpdateResidentialLeaseProperty
LandProperty
LandSoldProperty
LandPropertyExtended
LandSoldPropertyExtended
AddUpdateLandProperty
RuralProperty
RuralSoldProperty
AddUpdateRuralProperty
RuralPropertyExtended
RuralSoldPropertyExtended
CommercialProperty
CommercialPropertyExtended
CommercialSaleProperty
CommercialSoldProperty
CommercialSalePropertyExtended
CommercialSoldPropertyExtended
CommercialLeaseProperty
CommercialLeasePropertyExtended
AddUpdateCommercialProperty
AddUpdateCommercialLeaseProperty
AddUpdateCommercialSaleProperty
BusinessProperty
BusinessSoldProperty
BusinessPropertyExtended
BusinessSoldPropertyExtended
AddUpdateBusinessProperty
HolidayRentalProperty
HolidayRentalPropertyExtended
AddUpdateHolidayRentalProperty
BuildingSearchResult
PropertySearchResult
ContactSearchResult
Rate
Area
AreaRange
UpdateUser
CustomFieldGrouping
CustomField
AddUpdateCustomField
ActivityLog
ContactFile
CalendarEvent
CalendarContact
AddUpdateCalendarEvent
PropertyFile
PropertyFileWithFolders
PropertyFileFolder
CoreLogicAddressSuggest
CoreLogicProperty
UpdateContact
AddContact
Supplier
SupplierExtended
UpdateSupplier
AddSupplier
ContactRequirement
AddUpdateContactRequirement
PropertyType
PropertyClass
Access
Team
CoreLogicAvm
CoreLogicRentalAvm
ContactContext
LinkedProperty
UserSubscriptions
RentFrequency
Tenancy
PropertyFeedback
Geolocation
ExternalLinkType
ExternalLink
AddUpdateExternalLink
OfferCondition
PropertyOfferCondition
UpdatePropertyOfferCondition
PropertyOfferConditionWithProperty
Signature
AuctionDetails
TenderDetails
SetSaleDateDetails
OpenHome
AddUpdateOpenHome
OpenHomeWithProperty
EnquirySource
AddUpdateEnquirySource
BulkContactNote
Task
TaskContact
AddTask
UpdateTask
PropertyFeatureGrouping
UpdatePropertyFeatureGrouping
PropertyFeature
UpdatePropertyFeature
Enquiry
AddEnquiry
SMS
BulkSMS
Email
BulkEmail
AccountPricingUnit
AccountPricing
Token
Metric
UpdatePortalStatsTotal
UpdatePortalStatsCumulative
PortalStats
EmailTemplate
AddUpdateEmailTemplate
SMSTemplate
AddUpdateSMSTemplate
OwnerSummaryTemplate
AddUpdateOwnerSummaryTemplate
LeaseHistory
SaleHistory
PhotoTag
AccountFranchise
ContactInterest
ContactMinimal
PropertyLifeInterest
PropertyLifeEnquirySource
UpdatePropertyLifeEnquirySource
UpdatePropertyLifeInterest
RequirementAndContact
ContactAndMarketingUser
ContactAndCount
PropertyFileWithFoldersUpload
FileToBeUploaded
Portal
PortalAccess
PropertyPhotoUpload
ContactFileUpload
MaintenancePhoto
AddMaintenancePhoto
Maintenance
AddMaintenance
UpdateMaintenance
MaintenanceRequest
AddMaintenanceRequest
MaintenanceNote
Inspection
AddInspection
UpdateInspection
Insurance
TrustAccount
TenancyExtended
TenancyAndProperty
PropertyRoom
ContactNoteWithContact
FlushProperty
CommercialDeal
CommercialDealSale
CommercialDealLease
CommissionSplitType
PreDistributionDeduction
OfficeDeduction
OfficeReferral
CommissionSplitDeduction
CommissionSplit
FullSaleHistory
EntityType
IntegratorPropertyStat
UpdateIntegratorPropertyStats
InsertScheduledViewing
MessageReceipt
Message
MessageRecipient
MessageThread
AddUpdateMessageThread
InspectionWithProperty
AdvertisingScheduleItem
AdvertisingSchedule
AdvertisingScheduleWithItems
AdvertisingAttachedScheduleItem
AdvertisingAttachedSchedule
AdvertisingAttachedScheduleWithItems
AdvertisingLedgerType
AdvertisingPaymentType
AdvertisingSupplier
AddUpdateAdvertisingSupplier
AdvertisingExpenseType
AdvertisingInvoice
AdvertisingTransaction
AddAdvertisingPayment
PriceQualifier
TenureOrTitleType
HoldingAreaType
MethodOfSaleType
AuctionType
PropertyKey
AddUpdatePropertyKey
ContactBankAccount
AddUpdateContactBankAccount
ContactDateType
ContactDate
ContactAndDate
DistributionList
PropertyPortalId
PropertyAlarmDetails
UnsubscribeType
Vertex
Precinct
FeesCharges
ClearingSalesProperty
ClearingSalesSoldProperty
AddUpdateClearingSalesProperty
ClearingSalesPropertyExtended
ClearingSalesSoldPropertyExtended
LivestockProperty
LivestockSoldProperty
AddUpdateLivestockProperty
LivestockPropertyExtended
LivestockSoldPropertyExtended
FMSLeadContact
FMSLeadProperty
FMSLead
AddFMSLead
PropertyOfferStatus
PropertyOffer
AddPropertyOffer
UpdatePropertyOffer
BulkContactSourceOfEnquiry
ConjunctionalSale
ServiceChargeFrequency
SharedOwnership
Leasehold
ServiceCharge
PropertyListingConfiguration
PropertyStrataProperty
PropertyProjectProperty
MatchingContactsRequest
EventStreamItem
securitySchemes
Furnished
AddPropertyActivityNote
CampaignComments
Campaign
CampaignTracking
CampaignTrackingSummary
HazardsAndRisks
ExternalFeedback
InsertExternalFeedback
SaleSummary
ReinzSale
CustomRegion
ExternalReference
NZDistrict
Online validator badge