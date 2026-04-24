# Health Facilities Reference Chart

This chart summarizes the health facility hierarchy represented in the Tamil Nadu health dataset.

```mermaid
flowchart TD
    A["Tamil Nadu Public Health Network"]

    A --> B["HSC<br/>Health Sub Centre"]
    A --> C["PHC<br/>Primary Health Centre"]
    A --> D["CHC<br/>Community Health Centre"]
    A --> E["SDH<br/>Sub-District Hospital"]
    A --> F["DH<br/>District Hospital"]
    A --> G["MCH<br/>Medical College Hospital"]

    B --> B1["Hyper-local rural access"]
    B --> B2["Village-level preventive and basic care"]
    B --> B3["Many tagged as HWC"]

    C --> C1["Primary outpatient care"]
    C --> C2["Includes Addl. PHC and Urban PHC"]
    C --> C3["Many 24x7 and delivery points"]

    D --> D1["Referral centre above PHC"]
    D --> D2["Many CHCs act as FRU"]
    D --> D3["Some blood storage and newborn support"]

    E --> E1["Taluk / sub-district referral hospital"]
    E --> E2["More emergency and diagnostic capacity"]
    E --> E3["Dialysis, CT, blood support in some sites"]

    F --> F1["District-level major hospital"]
    F --> F2["Stronger emergency and specialist care"]
    F --> F3["Often CT, dialysis, SNCU, blood bank"]

    G --> G1["Top-tier public hospital in this dataset"]
    G --> G2["Advanced specialist and maternal care"]
    G --> G3["Often MRI, CT, SNCU, cath lab, STEMI support"]

    subgraph R["Referral / Escalation Flow"]
      B --> C
      C --> D
      D --> E
      E --> F
      F --> G
    end

    subgraph U["Urban / Administrative Variants"]
      C --> U1["Urban PHC"]
      C --> U2["Addl. PHC"]
      D --> U3["UG-CHC"]
      E --> U4["FRU-capable SDH"]
      F --> U5["FRU-capable DH"]
      G --> U6["MCH-FRU"]
    end

    subgraph P["Capability Progression"]
      P1["Base Care"] --> P2["Delivery / 24x7 / HWC"]
      P2 --> P3["FRU / Blood Storage / NBSU"]
      P3 --> P4["CT / Dialysis / SNCU / Blood Bank"]
      P4 --> P5["MRI / Cath Lab / STEMI / Advanced Specialty Care"]
    end

    B -. usually .-> P1
    C -. often .-> P2
    D -. increasingly .-> P3
    E -. commonly .-> P4
    F -. strongly .-> P4
    G -. strongest .-> P5

    subgraph X["Key Abbreviations"]
      X1["HSC = Health Sub Centre"]
      X2["PHC = Primary Health Centre"]
      X3["CHC = Community Health Centre"]
      X4["SDH = Sub-District Hospital"]
      X5["DH = District Hospital"]
      X6["MCH = Medical College Hospital"]
      X7["HWC = Health and Wellness Centre"]
      X8["FRU = First Referral Unit"]
      X9["SNCU = Special Newborn Care Unit"]
      X10["NBSU = Newborn Stabilization Unit"]
    end
```

## Practical Reading Guide

- `HSC` and `PHC` are the broad population coverage network.
- `CHC` and `SDH` are the referral network.
- `DH` and `MCH` are the advanced hospital network.
- Capability intensity generally increases as you move from `HSC` to `MCH`.
