export const claim_abi = [
    {
        name: 'ProvisionStarknetImpl',
        type: 'impl',
        interface_name: 'src::starknet::starknet_provision_interface::IProvisionStarknet'
    },
    {
        name: 'core::integer::u256',
        type: 'struct',
        members: [
            {
                name: 'low',
                type: 'core::integer::u128'
            },
            {
                name: 'high',
                type: 'core::integer::u128'
            }
        ]
    },
    {
        name: 'core::array::Span::<core::felt252>',
        type: 'struct',
        members: [
            {
                name: 'snapshot',
                type: '@core::array::Array::<core::felt252>'
            }
        ]
    },
    {
        name: 'src::utils::ClaimData',
        type: 'struct',
        members: [
            {
                name: 'identity',
                type: 'core::felt252'
            },
            {
                name: 'balance',
                type: 'core::integer::u256'
            },
            {
                name: 'index',
                type: 'core::integer::u128'
            },
            {
                name: 'merkle_path',
                type: 'core::array::Span::<core::felt252>'
            }
        ]
    },
    {
        name: 'src::utils::ClaimStatus',
        type: 'enum',
        variants: [
            {
                name: 'Claimable',
                type: '()'
            },
            {
                name: 'TimeoutExpired',
                type: '()'
            },
            {
                name: 'AlreadyClaimed',
                type: '()'
            },
            {
                name: 'InvalidDecommitment',
                type: '()'
            },
            {
                name: 'Frozen',
                type: '()'
            }
        ]
    },
    {
        name: 'src::utils::StarkClaimTransfer',
        type: 'struct',
        members: [
            {
                name: 'claim_data',
                type: 'src::utils::ClaimData'
            },
            {
                name: 'recipient',
                type: 'core::starknet::contract_address::ContractAddress'
            },
            {
                name: 'signature',
                type: 'core::array::Span::<core::felt252>'
            }
        ]
    },
    {
        name: 'src::starknet::starknet_provision_interface::IProvisionStarknet',
        type: 'interface',
        items: [
            {
                name: 'is_claimable',
                type: 'function',
                inputs: [
                    {
                        name: 'claim_data',
                        type: 'src::utils::ClaimData'
                    }
                ],
                outputs: [
                    {
                        type: 'src::utils::ClaimStatus'
                    }
                ],
                state_mutability: 'view'
            },
            {
                name: 'claim_as_caller',
                type: 'function',
                inputs: [
                    {
                        name: 'claim_data',
                        type: 'src::utils::ClaimData'
                    },
                    {
                        name: 'recipient',
                        type: 'core::starknet::contract_address::ContractAddress'
                    }
                ],
                outputs: [],
                state_mutability: 'external'
            },
            {
                name: 'claim_with_sig',
                type: 'function',
                inputs: [
                    {
                        name: 'stark_claim_transfer',
                        type: 'src::utils::StarkClaimTransfer'
                    }
                ],
                outputs: [],
                state_mutability: 'external'
            },
            {
                name: 'claim',
                type: 'function',
                inputs: [
                    {
                        name: 'claim_data',
                        type: 'src::utils::ClaimData'
                    }
                ],
                outputs: [],
                state_mutability: 'external'
            },
            {
                name: 'validate_address',
                type: 'function',
                inputs: [],
                outputs: [
                    {
                        type: 'core::starknet::contract_address::ContractAddress'
                    }
                ],
                state_mutability: 'external'
            }
        ]
    },
    {
        name: 'core::starknet::eth_address::EthAddress',
        type: 'struct',
        members: [
            {
                name: 'address',
                type: 'core::felt252'
            }
        ]
    },
    {
        name: 'constructor',
        type: 'constructor',
        inputs: [
            {
                name: 'unique_id',
                type: 'core::felt252'
            },
            {
                name: 'root',
                type: 'core::felt252'
            },
            {
                name: 'height',
                type: 'core::integer::u32'
            },
            {
                name: 'termination_delay',
                type: 'core::integer::u64'
            },
            {
                name: 'token_address',
                type: 'core::starknet::contract_address::ContractAddress'
            },
            {
                name: 'admin',
                type: 'core::starknet::eth_address::EthAddress'
            }
        ]
    },
    {
        name: 'handle_clearance_signal',
        type: 'l1_handler',
        inputs: [
            {
                name: 'from_address',
                type: 'core::felt252'
            },
            {
                name: 'recipient',
                type: 'core::starknet::contract_address::ContractAddress'
            }
        ],
        outputs: [],
        state_mutability: 'view'
    },
    {
        name: 'handle_freeze_signal',
        type: 'l1_handler',
        inputs: [
            {
                name: 'from_address',
                type: 'core::felt252'
            }
        ],
        outputs: [],
        state_mutability: 'external'
    },
    {
        kind: 'struct',
        name: 'src::starknet::starknet_provision::ProvisionStarknet::ClaimServed',
        type: 'event',
        members: [
            {
                kind: 'data',
                name: 'identity',
                type: 'core::felt252'
            },
            {
                kind: 'data',
                name: 'amount',
                type: 'core::integer::u256'
            },
            {
                kind: 'data',
                name: 'recipient',
                type: 'core::starknet::contract_address::ContractAddress'
            }
        ]
    },
    {
        kind: 'struct',
        name: 'src::starknet::starknet_provision::ProvisionStarknet::ClaimRejected',
        type: 'event',
        members: [
            {
                kind: 'data',
                name: 'identity',
                type: 'core::felt252'
            },
            {
                kind: 'data',
                name: 'reason',
                type: 'core::felt252'
            }
        ]
    },
    {
        kind: 'enum',
        name: 'src::starknet::starknet_provision::ProvisionStarknet::Event',
        type: 'event',
        variants: [
            {
                kind: 'nested',
                name: 'ClaimServed',
                type: 'src::starknet::starknet_provision::ProvisionStarknet::ClaimServed'
            },
            {
                kind: 'nested',
                name: 'ClaimRejected',
                type: 'src::starknet::starknet_provision::ProvisionStarknet::ClaimRejected'
            }
        ]
    }
]
