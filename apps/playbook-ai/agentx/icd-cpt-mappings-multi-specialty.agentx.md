# ICD-10 and CPT Mappings — Multi-Specialty AgentX

> **Purpose:** Reference ICD-10 and CPT code mappings for Pain, Derm, Emergency, and EM specialties. Use to populate coding-engine `icd_mappings` and `cpt_mappings` tables or implement data loaders.

**Related:**
- `apps/playbook-ai/agentx/coding-ai-multi-specialty-support.agentx.md` — Extension spec
- `apps/*/playbook.agentx.md` — Source playbooks and rules

---

## 1. PAIN — Pain Management

### 1.1 ICD-10 Mappings (specialty: PAIN)

| Code | Description | Category | Keywords |
|------|-------------|----------|----------|
| M54.2 | Cervicalgia | Musculoskeletal | neck pain,cervical,cervicalgia |
| M54.02 | Occipito-atlanto-axial region pain | Musculoskeletal | upper cervical,neck pain,c1,c2 |
| M54.03 | Cervicothoracic region pain | Musculoskeletal | neck pain,cervical,thoracic,junction |
| M54.6 | Pain in thoracic spine | Musculoskeletal | thoracic,spine,mid back,pain |
| M54.04 | Thoracic region pain | Musculoskeletal | thoracic,mid back,pain |
| M54.5 | Low back pain | Musculoskeletal | low back pain,lumbar,lumbago |
| M54.50 | Low back pain, unspecified | Musculoskeletal | low back pain,lumbar,unspecified |
| M54.51 | Vertebrogenic low back pain | Musculoskeletal | low back pain,vertebrogenic,endplate |
| M54.59 | Other low back pain | Musculoskeletal | low back pain,other,lumbar |
| M54.08 | Lumbosacral region pain | Musculoskeletal | low back pain,lumbosacral,l5-s1 |
| M54.15 | Radiculopathy, thoracolumbar region | Musculoskeletal | radiculopathy,thoracolumbar,nerve root |
| M54.16 | Radiculopathy, lumbar region | Musculoskeletal | radiculopathy,lumbar,nerve root,sciatica |
| M54.17 | Radiculopathy, lumbosacral region | Musculoskeletal | radiculopathy,lumbosacral,nerve root,sciatica |
| M54.30 | Sciatica, unspecified side | Musculoskeletal | sciatica,leg pain,sciatic nerve |
| M54.31 | Sciatica, right side | Musculoskeletal | sciatica,right leg,pain,sciatic nerve |
| M54.32 | Sciatica, left side | Musculoskeletal | sciatica,left leg,pain,sciatic nerve |
| M54.40 | Lumbago with sciatica, unspecified side | Musculoskeletal | low back pain,sciatica,lumbago |
| M54.41 | Lumbago with sciatica, right side | Musculoskeletal | low back pain,sciatica,right,lumbago |
| M54.42 | Lumbago with sciatica, left side | Musculoskeletal | low back pain,sciatica,left,lumbago |
| M50.20 | Cervical disc displacement, unspecified level | Musculoskeletal | cervical,disc,herniation,neck |
| M50.22 | Cervical disc displacement, mid-cervical level | Musculoskeletal | cervical,disc,herniation,c4-c5,c5-c6 |
| M50.30 | Cervical disc degeneration, unspecified level | Musculoskeletal | cervical,disc,degeneration,degenerative |
| M50.32 | Cervical disc degeneration, mid-cervical level | Musculoskeletal | cervical,disc,degeneration,c4-c5,c5-c6 |
| M51.26 | Intervertebral disc displacement, lumbar region | Musculoskeletal | lumbar,disc,herniation,back |
| M51.27 | Intervertebral disc displacement, lumbosacral region | Musculoskeletal | lumbar,disc,herniation,l5-s1 |
| M51.36 | Intervertebral disc degeneration, lumbar region | Musculoskeletal | lumbar,disc,degeneration,degenerative |
| M51.37 | Intervertebral disc degeneration, lumbosacral region | Musculoskeletal | lumbar,disc,degeneration,l5-s1 |
| M48.06 | Spinal stenosis, lumbar region | Musculoskeletal | spinal stenosis,lumbar,narrowing |
| M48.07 | Spinal stenosis, lumbosacral region | Musculoskeletal | spinal stenosis,lumbosacral,narrowing |
| M48.02 | Spinal stenosis, cervical region | Musculoskeletal | spinal stenosis,cervical,narrowing,neck |
| M47.26 | Spondylosis with radiculopathy, lumbar region | Musculoskeletal | spondylosis,radiculopathy,lumbar,degenerative |
| M47.27 | Spondylosis with radiculopathy, lumbosacral region | Musculoskeletal | spondylosis,radiculopathy,lumbosacral,degenerative |
| M53.3 | Sacrococcygeal disorders | Musculoskeletal | sacrococcygeal,low back |
| M46.1 | Sacroiliitis | Musculoskeletal | sacroiliitis,SI joint,sacral |
| G89.29 | Other chronic pain | Neurological | chronic pain,pain syndrome |
| M79.3 | Panniculitis, unspecified | Musculoskeletal | panniculitis,fat |
| R52 | Pain, unspecified | General | pain,unspecified |

### 1.2 CPT Mappings (specialty: PAIN)

| Code | Description | Category | Keywords |
|------|-------------|----------|----------|
| 62310 | Epidural injection, cervical/thoracic (interlaminar) | Injections | epidural,cervical,thoracic,interlaminar,esi |
| 62311 | Epidural injection, lumbar/sacral (interlaminar) | Injections | epidural,lumbar,sacral,interlaminar,esi |
| 62320 | Epidural injection, cervical/thoracic, without imaging | Injections | epidural,cervical,thoracic,without imaging |
| 62321 | Epidural injection, cervical/thoracic, with imaging | Injections | epidural,cervical,thoracic,with imaging |
| 62322 | Caudal epidural injection, without imaging | Injections | caudal,epidural,sacral |
| 62323 | Caudal epidural injection, with imaging | Injections | caudal,epidural,fluoroscopy,sacral |
| 64479 | Transforaminal epidural, cervical/thoracic, single level | Injections | transforaminal,epidural,cervical,tfesi,nerve root |
| 64480 | Transforaminal epidural, cervical/thoracic, each additional level | Injections | transforaminal,epidural,cervical,additional,tfesi |
| 64483 | Transforaminal epidural, lumbar/sacral, single level | Injections | transforaminal,epidural,lumbar,tfesi,nerve root |
| 64484 | Transforaminal epidural, lumbar/sacral, each additional level | Injections | transforaminal,epidural,lumbar,additional,tfesi |
| 64490 | Facet joint injection, cervical/thoracic, single level | Injections | facet,injection,cervical,thoracic,medial branch |
| 64491 | Facet joint injection, cervical/thoracic, second level | Injections | facet,injection,cervical,thoracic,second level |
| 64492 | Facet joint injection, cervical/thoracic, third+ levels | Injections | facet,injection,cervical,thoracic,additional |
| 64493 | Facet joint injection, lumbar/sacral, single level | Injections | facet,injection,lumbar,sacral,medial branch |
| 64494 | Facet joint injection, lumbar/sacral, second level | Injections | facet,injection,lumbar,sacral,second level |
| 64495 | Facet joint injection, lumbar/sacral, third+ levels | Injections | facet,injection,lumbar,sacral,additional |
| 64633 | RFA, cervical/thoracic facet nerve, first level | Injections | RFA,radiofrequency,cervical,facet,neurolytic |
| 64634 | RFA, cervical/thoracic, second level | Injections | RFA,radiofrequency,cervical,facet |
| 64635 | RFA, cervical/thoracic, third+ levels | Injections | RFA,radiofrequency,cervical,facet |
| 64636 | RFA, lumbar/sacral facet nerve, first level | Injections | RFA,radiofrequency,lumbar,facet,neurolytic |
| 64637 | RFA, lumbar/sacral, each additional level | Injections | RFA,radiofrequency,lumbar,facet,additional |
| 27096 | Injection, sacroiliac joint | Injections | sacroiliac,SI joint,injection |

---

## 2. DERMATOLOGY

### 2.1 ICD-10 Mappings (specialty: DERMATOLOGY)

| Code | Description | Category | Keywords |
|------|-------------|----------|----------|
| L70.0 | Acne vulgaris | Skin | acne,vulgaris |
| L70.1 | Acne conglobata | Skin | acne,conglobata |
| L70.8 | Other acne | Skin | acne,other |
| L20.9 | Atopic dermatitis, unspecified | Skin | eczema,atopic,dermatitis |
| L23.9 | Allergic contact dermatitis, unspecified | Skin | contact,dermatitis,allergic |
| L24.9 | Irritant contact dermatitis, unspecified | Skin | contact,dermatitis,irritant |
| L25.9 | Unspecified contact dermatitis | Skin | contact,dermatitis |
| L21.9 | Seborrheic dermatitis, unspecified | Skin | seborrheic,dermatitis,dandruff |
| L30.9 | Dermatitis, unspecified | Skin | dermatitis,unspecified |
| L40.0 | Psoriasis vulgaris | Skin | psoriasis,vulgaris |
| L40.9 | Psoriasis, unspecified | Skin | psoriasis,unspecified |
| L40.50 | Arthropathic psoriasis, unspecified | Skin | psoriasis,arthropathy |
| L57.0 | Actinic keratosis | Skin | actinic,keratosis,AK,sun damage |
| L57.1 | Actinic reticuloid | Skin | actinic,reticuloid |
| L82.0 | Irritated seborrheic keratosis | Skin | seborrheic,keratosis,SK |
| L82.1 | Inflamed seborrheic keratosis | Skin | seborrheic,keratosis,inflamed |
| D23.9 | Benign neoplasm of skin, unspecified | Skin | benign,nevus,mole |
| L91.8 | Other hypertrophic disorders (skin tags) | Skin | skin tag,hypertrophic |
| L72.0 | Epidermal cyst | Skin | cyst,epidermal |
| L72.1 | Trichilemmal cyst | Skin | cyst,trichilemmal,pilar |
| C44.31 | BCC of skin of nose | Skin | basal cell,carcinoma,nose,BCC |
| C44.41 | BCC of skin of scalp | Skin | basal cell,carcinoma,scalp,BCC |
| C44.51 | BCC of skin of trunk | Skin | basal cell,carcinoma,trunk,BCC |
| C44.61 | BCC of skin of upper limb | Skin | basal cell,carcinoma,arm,BCC |
| C44.71 | BCC of skin of lower limb | Skin | basal cell,carcinoma,leg,BCC |
| C44.90 | BCC of skin, unspecified | Skin | basal cell,carcinoma,BCC |
| C44.32 | SCC of skin of nose | Skin | squamous cell,carcinoma,nose,SCC |
| C44.42 | SCC of skin of scalp | Skin | squamous cell,carcinoma,scalp,SCC |
| C44.52 | SCC of skin of trunk | Skin | squamous cell,carcinoma,trunk,SCC |
| C44.62 | SCC of skin of upper limb | Skin | squamous cell,carcinoma,arm,SCC |
| C44.72 | SCC of skin of lower limb | Skin | squamous cell,carcinoma,leg,SCC |
| C44.92 | SCC of skin, unspecified | Skin | squamous cell,carcinoma,SCC |
| C43.30 | Malignant melanoma of unspecified part of face | Skin | melanoma,face |
| C43.31 | Malignant melanoma of nose | Skin | melanoma,nose |
| C43.51 | Malignant melanoma of trunk | Skin | melanoma,trunk |
| C43.61 | Malignant melanoma of right upper limb | Skin | melanoma,arm,right |
| C43.71 | Malignant melanoma of right lower limb | Skin | melanoma,leg,right |
| L98.1 | Dermatitis factitia | Skin | factitial,dermatitis |
| L29.9 | Pruritus, unspecified | Skin | itch,pruritus |
| L98.8 | Other specified disorders of skin | Skin | skin,disorder |
| B07.0 | Plantar wart | Skin | wart,plantar,verruca |
| B07.8 | Other viral warts | Skin | wart,viral,verruca |

### 2.2 CPT Mappings (specialty: DERMATOLOGY)

| Code | Description | Category | Keywords |
|------|-------------|----------|----------|
| 11102 | Tangential biopsy (shave), single lesion | Biopsy | biopsy,shave,tangential,single |
| 11103 | Tangential biopsy, each additional lesion | Biopsy | biopsy,shave,tangential,additional |
| 11104 | Punch biopsy, single lesion | Biopsy | biopsy,punch,single |
| 11105 | Punch biopsy, each additional lesion | Biopsy | biopsy,punch,additional |
| 11106 | Incisional biopsy, single lesion | Biopsy | biopsy,incisional,single |
| 11107 | Incisional biopsy, each additional lesion | Biopsy | biopsy,incisional,additional |
| 11300 | Shave removal, trunk/arms/legs, ≤0.5 cm | Shave | shave,trunk,arms,legs |
| 11301 | Shave removal, trunk/arms/legs, 0.6–1.0 cm | Shave | shave,trunk,arms,legs |
| 11302 | Shave removal, trunk/arms/legs, 1.1–2.0 cm | Shave | shave,trunk,arms,legs |
| 11303 | Shave removal, trunk/arms/legs, 2.1–3.0 cm | Shave | shave,trunk,arms,legs |
| 11310 | Shave removal, face/ears/eyelids/nose/lips, ≤0.5 cm | Shave | shave,face,ears,eyelids,nose,lips |
| 11311 | Shave removal, face, 0.6–1.0 cm | Shave | shave,face |
| 11312 | Shave removal, face, 1.1–2.0 cm | Shave | shave,face |
| 11313 | Shave removal, face, 2.1–3.0 cm | Shave | shave,face |
| 11400 | Excision benign, trunk/arms/legs, ≤0.5 cm | Excision | excision,benign,trunk |
| 11401 | Excision benign, trunk/arms/legs, 0.6–1.0 cm | Excision | excision,benign,trunk |
| 11402 | Excision benign, trunk/arms/legs, 1.1–2.0 cm | Excision | excision,benign,trunk |
| 11403 | Excision benign, trunk/arms/legs, 2.1–3.0 cm | Excision | excision,benign,trunk |
| 11404 | Excision benign, trunk/arms/legs, 3.1–4.0 cm | Excision | excision,benign,trunk |
| 11420 | Excision benign, face, ≤0.5 cm | Excision | excision,benign,face |
| 11421 | Excision benign, face, 0.6–1.0 cm | Excision | excision,benign,face |
| 11600 | Excision malignant, trunk/arms/legs, ≤0.5 cm | Excision | excision,malignant,trunk |
| 11601 | Excision malignant, trunk/arms/legs, 0.6–1.0 cm | Excision | excision,malignant,trunk |
| 11602 | Excision malignant, trunk/arms/legs, 1.1–2.0 cm | Excision | excision,malignant,trunk |
| 11603 | Excision malignant, trunk/arms/legs, 2.1–3.0 cm | Excision | excision,malignant,trunk |
| 11604 | Excision malignant, trunk/arms/legs, 3.1–4.0 cm | Excision | excision,malignant,trunk |
| 11620 | Excision malignant, face, ≤0.5 cm | Excision | excision,malignant,face |
| 11621 | Excision malignant, face, 0.6–1.0 cm | Excision | excision,malignant,face |
| 17000 | Destruction, premalignant (e.g., AK), first lesion | Destruction | destruction,actinic,keratosis,AK |
| 17003 | Destruction, premalignant, second through 14th lesions | Destruction | destruction,premalignant,multiple |
| 17004 | Destruction, premalignant, 15+ lesions | Destruction | destruction,premalignant,multiple |
| 17110 | Destruction, flat warts, molluscum, milia; up to 14 | Destruction | destruction,warts,molluscum,milia |
| 17111 | Destruction, flat warts, molluscum, milia; 15+ | Destruction | destruction,warts,molluscum,milia |
| 17250 | Chemical cautery, benign lesion | Destruction | chemical,cautery,benign |
| 17260 | Cryosurgery, malignant lesion; ≤0.5 cm | Destruction | cryo,malignant |
| 17261 | Cryosurgery, malignant lesion; 0.6–1.0 cm | Destruction | cryo,malignant |
| 17280 | Electrosurgery, malignant lesion; ≤0.5 cm | Destruction | electrosurgery,malignant |
| 17281 | Electrosurgery, malignant lesion; 0.6–1.0 cm | Destruction | electrosurgery,malignant |
| 17311 | Mohs, first stage, up to 5 blocks | Mohs | Mohs,micrographic,surgery,first stage |
| 17312 | Mohs, second stage, up to 5 blocks | Mohs | Mohs,micrographic,surgery,second stage |
| 17313 | Mohs, third stage, up to 5 blocks | Mohs | Mohs,micrographic,surgery,third stage |
| 96567 | Photodynamic therapy, per session | Phototherapy | photodynamic,PDT |
| 96912 | Photochemotherapy, UVB | Phototherapy | photochemotherapy,UVB |
| 96913 | Photochemotherapy, PUVA | Phototherapy | photochemotherapy,PUVA |
| 99202 | Office visit, new patient, straightforward | E/M | office,new,straightforward |
| 99203 | Office visit, new patient, low | E/M | office,new,low |
| 99204 | Office visit, new patient, moderate | E/M | office,new,moderate |
| 99205 | Office visit, new patient, high | E/M | office,new,high |
| 99212 | Office visit, established, straightforward | E/M | office,established,straightforward |
| 99213 | Office visit, established, low | E/M | office,established,low |
| 99214 | Office visit, established, moderate | E/M | office,established,moderate |
| 99215 | Office visit, established, high | E/M | office,established,high |

---

## 3. EMERGENCY / URGENT CARE

### 3.1 ICD-10 Mappings (specialty: EMERGENCY)

| Code | Description | Category | Keywords |
|------|-------------|----------|----------|
| J00 | Acute nasopharyngitis (common cold) | Respiratory | cold,URI,congestion |
| J02.9 | Acute pharyngitis, unspecified | Respiratory | pharyngitis,sore throat,strep |
| J06.9 | Acute upper respiratory infection, unspecified | Respiratory | URI,upper respiratory,cold |
| J11.1 | Influenza with respiratory manifestations | Respiratory | flu,influenza |
| J18.9 | Pneumonia, unspecified | Respiratory | pneumonia |
| J20.9 | Acute bronchitis, unspecified | Respiratory | bronchitis |
| N39.0 | Urinary tract infection, site not specified | Urinary | UTI,urinary,infection |
| N30.00 | Acute cystitis, unspecified | Urinary | cystitis,bladder,UTI |
| H66.90 | Otitis media, unspecified | Ear | otitis,ear infection,middle ear |
| H66.91 | Otitis media, right ear | Ear | otitis,ear infection,right |
| H66.92 | Otitis media, left ear | Ear | otitis,ear infection,left |
| H60.90 | Unspecified otitis externa | Ear | otitis externa,swimmer ear |
| L23.9 | Allergic contact dermatitis, unspecified | Skin | contact,dermatitis,rash |
| L24.9 | Irritant contact dermatitis, unspecified | Skin | contact,dermatitis,rash |
| L08.9 | Localized infection of skin, unspecified | Skin | skin,infection,cellulitis |
| S01.90XA | Unspecified open wound of head, initial encounter | Injury | laceration,head,wound |
| S61.419A | Laceration without foreign body, unspecified hand, initial encounter | Injury | laceration,hand,wound |
| S93.401A | Sprain of unspecified ligament of right ankle, initial encounter | Injury | sprain,ankle,right |
| S93.402A | Sprain of unspecified ligament of left ankle, initial encounter | Injury | sprain,ankle,left |
| S43.401A | Sprain of unspecified ligament of right shoulder, initial encounter | Injury | sprain,shoulder,right |
| S72.001A | Unspecified fracture of right femoral neck, initial encounter | Injury | fracture,femur,hip |
| M25.511 | Pain in right shoulder | Musculoskeletal | shoulder,pain,right |
| M25.512 | Pain in left shoulder | Musculoskeletal | shoulder,pain,left |
| A09 | Diarrhea and gastroenteritis | Gastrointestinal | diarrhea,gastroenteritis,stomach |
| K21.9 | Gastro-esophageal reflux disease without esophagitis | Gastrointestinal | GERD,reflux,heartburn |
| R10.9 | Unspecified abdominal pain | General | abdominal,pain |
| R07.9 | Chest pain, unspecified | General | chest,pain |
| R51 | Headache | General | headache |
| R05 | Cough | General | cough |
| R50.9 | Fever, unspecified | General | fever |
| G43.909 | Migraine, unspecified, not intractable | Neurological | migraine,headache |

### 3.2 CPT Mappings (specialty: EMERGENCY)

| Code | Description | Category | Keywords |
|------|-------------|----------|----------|
| 99281 | ED visit, minimal | E/M | emergency,ED,minimal |
| 99282 | ED visit, low | E/M | emergency,ED,low |
| 99283 | ED visit, moderate | E/M | emergency,ED,moderate |
| 99284 | ED visit, high | E/M | emergency,ED,high |
| 99285 | ED visit, high severity | E/M | emergency,ED,high |
| 99202 | Office visit, new patient, straightforward | E/M | office,new,urgent |
| 99203 | Office visit, new patient, low | E/M | office,new,urgent |
| 99204 | Office visit, new patient, moderate | E/M | office,new,urgent |
| 99205 | Office visit, new patient, high | E/M | office,new,urgent |
| 99211 | Office visit, established, minimal | E/M | office,established,urgent |
| 99212 | Office visit, established, straightforward | E/M | office,established,urgent |
| 99213 | Office visit, established, low | E/M | office,established,urgent |
| 99214 | Office visit, established, moderate | E/M | office,established,urgent |
| 99215 | Office visit, established, high | E/M | office,established,urgent |
| 12011 | Simple repair, face, ≤2.5 cm | Laceration | laceration,repair,face,suture |
| 12013 | Simple repair, face, 2.6–5.0 cm | Laceration | laceration,repair,face,suture |
| 12014 | Simple repair, face, 5.1–7.5 cm | Laceration | laceration,repair,face,suture |
| 12031 | Layer closure, scalp/axilla/trunk/extremity, ≤7.5 cm | Laceration | laceration,repair,layer closure |
| 12032 | Layer closure, 7.6–12.5 cm | Laceration | laceration,repair,layer closure |
| 12001 | Simple repair, scalp/axilla/trunk/extremity, ≤2.5 cm | Laceration | laceration,repair,simple |
| 12002 | Simple repair, 2.6–5.0 cm | Laceration | laceration,repair,simple |
| 29125 | Short arm splint | Splinting | splint,arm,short |
| 29126 | Short arm cast | Splinting | cast,arm,short |
| 29515 | Short leg splint | Splinting | splint,leg,short |
| 29540 | Long leg cast | Splinting | cast,leg,long |
| 96372 | Therapeutic injection, subcutaneous/intramuscular | Injection | injection,sq,im |
| 96374 | IV push, single or initial drug | Injection | IV,push,injection |
| 80053 | Comprehensive metabolic panel | Lab | CMP,metabolic,panel |
| 85025 | CBC with differential | Lab | CBC,complete blood count |
| 81025 | Urine pregnancy test | Lab | pregnancy,urine,test |
| 87804 | Influenza, A or B, rapid | Lab | flu,influenza,rapid,test |
| 10060 | Incision and drainage, abscess | Procedure | I&D,abscess,drainage |

---

## 4. EM — Evaluation and Management (GENERAL)

### 4.1 ICD-10 Mappings (specialty: GENERAL)

*E/M encounters use general medicine diagnoses. Common ICD-10 for office/outpatient:*

| Code | Description | Category | Keywords |
|------|-------------|----------|----------|
| I10 | Essential (primary) hypertension | Cardiovascular | hypertension,HTN,blood pressure |
| E11.9 | Type 2 diabetes mellitus without complications | Endocrine | diabetes,type 2,DM2 |
| E11.65 | Type 2 diabetes with hyperglycemia | Endocrine | diabetes,hyperglycemia |
| J44.9 | COPD, unspecified | Respiratory | COPD,COPD,emphysema |
| M54.5 | Low back pain | Musculoskeletal | low back pain,lumbar |
| M54.2 | Cervicalgia | Musculoskeletal | neck pain,cervical |
| M25.511 | Pain in right shoulder | Musculoskeletal | shoulder,pain |
| M17.11 | Unilateral primary osteoarthritis, right knee | Musculoskeletal | knee,osteoarthritis,OA |
| G47.33 | Obstructive sleep apnea | Neurological | sleep apnea,OSA |
| F32.9 | Major depressive disorder, single episode, unspecified | Mental | depression,MDD |
| F41.9 | Anxiety disorder, unspecified | Mental | anxiety |
| K21.9 | GERD without esophagitis | Gastrointestinal | GERD,reflux |
| N39.0 | Urinary tract infection | Urinary | UTI |
| J06.9 | Acute upper respiratory infection | Respiratory | URI,cold |
| R10.9 | Unspecified abdominal pain | General | abdominal,pain |
| R07.9 | Chest pain, unspecified | General | chest,pain |
| R51 | Headache | General | headache |
| R05 | Cough | General | cough |
| R50.9 | Fever, unspecified | General | fever |
| Z00.00 | Encounter for general adult medical examination | General | physical,exam,wellness |
| Z23 | Encounter for immunization | General | immunization,vaccine |
| Z79.4 | Long term (current) use of anticoagulants | General | anticoagulant,warfarin |

### 4.2 CPT Mappings (specialty: GENERAL)

*E/M codes — office, hospital, ED, nursing facility, home, consultations*

| Code | Description | Category | Keywords |
|------|-------------|----------|----------|
| 99202 | Office visit, new patient, straightforward | E/M Office | office,new,straightforward |
| 99203 | Office visit, new patient, low | E/M Office | office,new,low |
| 99204 | Office visit, new patient, moderate | E/M Office | office,new,moderate |
| 99205 | Office visit, new patient, high | E/M Office | office,new,high |
| 99211 | Office visit, established, minimal | E/M Office | office,established,minimal |
| 99212 | Office visit, established, straightforward | E/M Office | office,established,straightforward |
| 99213 | Office visit, established, low | E/M Office | office,established,low |
| 99214 | Office visit, established, moderate | E/M Office | office,established,moderate |
| 99215 | Office visit, established, high | E/M Office | office,established,high |
| 99221 | Initial hospital care, straightforward/low | E/M Hospital | hospital,initial,inpatient |
| 99222 | Initial hospital care, moderate | E/M Hospital | hospital,initial,inpatient |
| 99223 | Initial hospital care, high | E/M Hospital | hospital,initial,inpatient |
| 99231 | Subsequent hospital care, straightforward/low | E/M Hospital | hospital,subsequent,inpatient |
| 99232 | Subsequent hospital care, moderate | E/M Hospital | hospital,subsequent,inpatient |
| 99233 | Subsequent hospital care, high | E/M Hospital | hospital,subsequent,inpatient |
| 99281 | ED visit, minimal | E/M ED | emergency,ED |
| 99282 | ED visit, low | E/M ED | emergency,ED |
| 99283 | ED visit, moderate | E/M ED | emergency,ED |
| 99284 | ED visit, high | E/M ED | emergency,ED |
| 99285 | ED visit, high severity | E/M ED | emergency,ED |
| 99291 | Critical care, first 30–74 min | E/M Critical | critical care |
| 99292 | Critical care, each additional 30 min | E/M Critical | critical care |
| 99242 | Office consultation, straightforward | E/M Consult | consultation,office |
| 99243 | Office consultation, low | E/M Consult | consultation,office |
| 99244 | Office consultation, moderate | E/M Consult | consultation,office |
| 99245 | Office consultation, high | E/M Consult | consultation,office |
| 99252 | Inpatient consultation, straightforward | E/M Consult | consultation,inpatient |
| 99253 | Inpatient consultation, low | E/M Consult | consultation,inpatient |
| 99254 | Inpatient consultation, moderate | E/M Consult | consultation,inpatient |
| 99255 | Inpatient consultation, high | E/M Consult | consultation,inpatient |
| 99304 | Initial nursing facility care, straightforward/low | E/M SNF | nursing facility,SNF,initial |
| 99305 | Initial nursing facility care, moderate | E/M SNF | nursing facility,SNF,initial |
| 99306 | Initial nursing facility care, high | E/M SNF | nursing facility,SNF,initial |
| 99307 | Subsequent nursing facility care, straightforward | E/M SNF | nursing facility,SNF,subsequent |
| 99308 | Subsequent nursing facility care, low | E/M SNF | nursing facility,SNF,subsequent |
| 99309 | Subsequent nursing facility care, moderate | E/M SNF | nursing facility,SNF,subsequent |
| 99310 | Subsequent nursing facility care, high | E/M SNF | nursing facility,SNF,subsequent |
| 99315 | Nursing facility discharge, 30 min or less | E/M SNF | nursing facility,discharge |
| 99316 | Nursing facility discharge, >30 min | E/M SNF | nursing facility,discharge |
| 99341 | Home visit, new patient, straightforward | E/M Home | home visit,new |
| 99342 | Home visit, new patient, low | E/M Home | home visit,new |
| 99343 | Home visit, new patient, moderate | E/M Home | home visit,new |
| 99344 | Home visit, new patient, moderate | E/M Home | home visit,new |
| 99345 | Home visit, new patient, high | E/M Home | home visit,new |
| 99347 | Home visit, established, straightforward | E/M Home | home visit,established |
| 99348 | Home visit, established, low | E/M Home | home visit,established |
| 99349 | Home visit, established, moderate | E/M Home | home visit,established |
| 99350 | Home visit, established, high | E/M Home | home visit,established |
| 99417 | Prolonged office/outpatient E/M, 15-min increments | E/M Add-on | prolonged,add-on |
| G2212 | Prolonged office/outpatient E/M (Medicare) | E/M Add-on | prolonged,Medicare,G2212 |

---

## 5. CARDIOLOGY (cardiac.ai)

> **Reference:** `apps/coding-ai/agentx/design/coding-ai-specialty-onboarding.agentx.md` — full onboarding pattern

### 5.1 ICD-10 Mappings (specialty: CARDIOLOGY)

| Code | Description | Category | Keywords |
|------|-------------|----------|----------|
| I10 | Essential (primary) hypertension | Cardiovascular | hypertension,HTN,blood pressure |
| I11.0 | Hypertensive heart disease with heart failure | Cardiovascular | hypertensive,CHF,heart failure |
| I25.10 | Atherosclerotic heart disease of native coronary artery without angina pectoris | Cardiovascular | CAD,coronary,atherosclerosis |
| I25.11 | Atherosclerotic heart disease of native coronary artery with angina pectoris | Cardiovascular | CAD,angina |
| I25.110 | Atherosclerotic heart disease of native coronary artery of unspecified vessel with unstable angina | Cardiovascular | CAD,unstable angina |
| I48.19 | Other persistent atrial fibrillation | Cardiovascular | AFib,atrial fibrillation,arrhythmia |
| I48.91 | Unspecified atrial fibrillation | Cardiovascular | AFib,atrial fibrillation |
| I50.9 | Heart failure, unspecified | Cardiovascular | CHF,heart failure,congestive |
| I50.22 | Chronic systolic heart failure | Cardiovascular | systolic,CHF,heart failure |
| I50.32 | Chronic diastolic heart failure | Cardiovascular | diastolic,CHF,heart failure |
| I35.0 | Nonrheumatic aortic (valve) stenosis | Cardiovascular | aortic stenosis,AS,valve |
| I35.1 | Nonrheumatic aortic (valve) insufficiency | Cardiovascular | aortic regurgitation,AR,valve |
| I34.0 | Nonrheumatic mitral (valve) stenosis | Cardiovascular | mitral stenosis,MS,valve |
| I34.1 | Nonrheumatic mitral (valve) insufficiency | Cardiovascular | mitral regurgitation,MR,valve |
| R00.0 | Tachycardia, unspecified | Cardiovascular | tachycardia,palpitations |
| R07.9 | Chest pain, unspecified | General | chest pain,angina |
| Z95.1 | Presence of coronary artery bypass graft | Cardiovascular | CABG,bypass,surgery |
| Z95.0 | Presence of cardiac pacemaker | Cardiovascular | pacemaker,PPM |
| Z95.2 | Presence of prosthetic heart valve | Cardiovascular | valve replacement,prosthetic |
| Z95.810 | Presence of drug eluting coronary stent | Cardiovascular | stent,DES,PCI |

### 5.2 CPT Mappings (specialty: CARDIOLOGY)

| Code | Description | Category | Keywords |
|------|-------------|----------|----------|
| 93000 | Electrocardiogram, routine ECG with at least 12 leads | Diagnostic | ECG,EKG,electrocardiogram |
| 93005 | Electrocardiogram, tracing only, without interpretation | Diagnostic | ECG,tracing |
| 93015 | Cardiovascular stress test using maximal or submaximal treadmill or bicycle exercise | Diagnostic | stress test,treadmill,exercise |
| 93016 | Cardiovascular stress test, with physician supervision | Diagnostic | stress test,supervision |
| 93306 | Echocardiography, transthoracic, complete | Diagnostic | echo,TTE,echocardiogram |
| 93312 | Echocardiography, transthoracic, complete, with Doppler | Diagnostic | echo,complete,Doppler |
| 93350 | Echocardiography, transthoracic, real-time with image documentation | Diagnostic | echo,TTE |
| 93454 | Catheter placement in coronary artery(s) for coronary angiography | Procedure | cath,catheterization,angiography |
| 93458 | Catheter placement in coronary artery(s) for coronary angiography, including left heart catheterization | Procedure | cath,combined,LHC,RHC |
| 93460 | Catheter placement in coronary artery(s) for coronary angiography with catheter placement(s) in bypass graft(s) | Procedure | cath,CABG,angiography |
| 93797 | Interrogation device evaluation, pacemaker system | Procedure | pacemaker,interrogation |
| 93798 | Interrogation device evaluation, implantable loop recorder | Procedure | loop recorder,ILR |
| 93279 | Interrogation device evaluation, ICD | Procedure | ICD,defibrillator,interrogation |
| 93224 | External electrocardiographic recording up to 48 hours | Diagnostic | Holter,ambulatory ECG |
| 99202 | Office visit, new patient, straightforward | E/M | office,new,straightforward |
| 99203 | Office visit, new patient, low | E/M | office,new,low |
| 99204 | Office visit, new patient, moderate | E/M | office,new,moderate |
| 99205 | Office visit, new patient, high | E/M | office,new,high |
| 99212 | Office visit, established, straightforward | E/M | office,established,straightforward |
| 99213 | Office visit, established, low | E/M | office,established,low |
| 99214 | Office visit, established, moderate | E/M | office,established,moderate |
| 99215 | Office visit, established, high | E/M | office,established,high |

---

## 6. Data Loader Usage

For each specialty, create a loader that:

1. **ICD:** `INSERT INTO icd_mappings (icd_code, description, category, specialty, keywords, severity, is_common)`
2. **CPT:** `INSERT INTO cpt_mappings (cpt_code, description, category, specialty, keywords, typical_setting, is_common)`

Use `ON CONFLICT DO UPDATE` to allow re-running loaders without duplicates.

**Example row format for ICD:**
```python
{'code': 'M54.5', 'description': 'Low back pain', 'category': 'Musculoskeletal', 
 'specialty': 'PAIN', 'keywords': 'low back pain,lumbar,lumbago', 'severity': 'Medium', 'is_common': 1}
```

**Example row format for CPT:**
```python
{'code': '64483', 'description': 'Transforaminal epidural, lumbar/sacral, single level', 
 'category': 'Injections', 'specialty': 'PAIN', 'keywords': 'transforaminal,epidural,lumbar,tfesi', 
 'typical_setting': 'Office/ASC', 'is_common': 1}
```

---

**END OF ICD-CPT MAPPINGS MULTI-SPECIALTY AGENTX**
