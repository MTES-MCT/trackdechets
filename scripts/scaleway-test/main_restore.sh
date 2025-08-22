#!/bin/bash

# Master script to deploy the scaleway instance, SSH into it and run what we want
imageid="ubuntu_noble"
sandbox_volume_size="40GB"
prod_volume_size="400GB"
sandbox_instance_size="DEV1-L"
prod_instance_size="DEV1-L"
sandbox_volume_snapshot_id="2bf194d5-a7dc-48c7-89fb-10ed76a2d1e1"
production_volume_snapshot_id_full="e217babc-74ca-403c-b9a3-661278d952eb"
production_volume_snapshot_id_empty="6dce8bb8-4827-4153-b71d-6186bd64d3f2"
project_id=$(grep "SCALEWAY_RESTORE_PROJECT_ID=" ../../.env | cut -d'=' -f2 | tr -d '"' | tr -d "'")

bold=$(tput bold)
reset=$(tput sgr0)
green=$(tput setaf 2)
red=$(tput setaf 9)

# 1. Create the instance

echo "${bold}→ Do you want to create a sandbox or prod testing instance, or delete an existing one?${reset}"
options=("Sandbox" "Production (full db, backup from 07/08/25)" "Production (empty)" "Delete" "Cancel")
select opt in "${options[@]}"
do
    case $opt in
        "Sandbox")
            echo "Creating sandbox instance..."
            instance_type="sandbox"
            volume_size=$sandbox_volume_size
            instance_size=$sandbox_instance_size
            volume_snapshot_id=$sandbox_volume_snapshot_id
            break
            ;;
        "Production (full db, backup from 07/08/25)")
            echo "Creating production instance..."
            instance_type="production"
            volume_size=$prod_volume_size
            instance_size=$prod_instance_size
            volume_snapshot_id=$production_volume_snapshot_id_full
            break
            ;;
        "Production (empty)")
            echo "Creating production instance..."
            instance_type="production"
            volume_size=$prod_volume_size
            instance_size=$prod_instance_size
            volume_snapshot_id=$production_volume_snapshot_id_empty
            break
            ;;
        "Delete")
            echo "Deleting instance..."
            instance_type="delete"
            break
            ;;
        "Cancel")
            echo "Cancelled."
            exit 0
            ;;
        *) echo "Invalid option $REPLY";;
    esac
done

if [ "$instance_type" == "delete" ]; then
    echo "${bold}→ Listing instances${reset}"
    
    # Get instance list and parse it
    instance_list=$(scw instance server list project-id=$project_id)
    
    # Extract instance info (skip header line, get ID, NAME, STATE)
    instances=()
    instance_ids=()
    
    while IFS= read -r line; do
        # Skip header line and empty lines
        if [[ "$line" == ID* ]] || [[ -z "$line" ]]; then
            continue
        fi
        
        # Extract fields using awk
        id=$(echo "$line" | awk '{print $1}')
        name=$(echo "$line" | awk '{print $2}')
        state=$(echo "$line" | awk '{print $4}')
        
        # Store for display and selection
        instances+=("$name ($state) - $id")
        instance_ids+=("$id")
    done <<< "$instance_list"
    
    # Check if any instances found
    if [ ${#instances[@]} -eq 0 ]; then
        echo "No instances found."
        exit 0
    fi
    
    # Add Cancel option
    instances+=("Cancel")
    
    echo "${bold}→ Select instance to delete:${reset}"
    select instance_choice in "${instances[@]}"
    do
        case $REPLY in
            $((${#instances[@]}))) # Cancel option (last item)
                echo "Cancelled."
                exit 0
                ;;
            [1-9]|[1-9][0-9]) # Valid selection
                if [ $REPLY -le ${#instance_ids[@]} ]; then
                    selected_instance_id="${instance_ids[$((REPLY-1))]}"
                    selected_instance_name=$(echo "${instances[$((REPLY-1))]}" | cut -d' ' -f1)
                    echo "Deleting instance: $selected_instance_name"
                    scw instance server terminate $selected_instance_id with-block=true with-ip=true
                    echo "Instance deleted."
                    exit 0
                else
                    echo "Invalid option $REPLY"
                fi
                ;;
            *) 
                echo "Invalid option $REPLY"
                ;;
        esac
    done
fi


output=$(scw instance server create type=$instance_size image=$imageid zone=fr-par-1 name=td-restore root-volume=block:$volume_snapshot_id)

# Extract both values
instance_id=$(echo "$output" | grep "^ID" | awk '{print $2}')
ip_address=$(echo "$output" | grep "PublicIP.Address" | awk '{print $2}')

echo "Instance created:"
echo "  ID: $instance_id"
echo "  IP: $ip_address"

scw instance server wait $instance_id

echo "${bold}→ Server ready${reset}"

echo "${bold}→ SSH into it${reset}"
echo "if you get a fingerprint error, run this : ssh-keygen -R $ip_address"
echo "ssh root@$ip_address"
echo "if you want to run an SSH tunnel to the database for a local client, run ssh -L 5433:127.0.0.1:5432 -N root@$ip_address"
echo "${bold}${red}→ Remember to delete the instance after you're done${reset}"
